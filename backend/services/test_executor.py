"""
测试执行引擎
"""
import asyncio
import time
from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
from sqlalchemy.orm import Session
from models.test_case import TestCase, TestCaseAPI
from models.api_doc import API
from models.test_execution import TestExecution, TestExecutionResult
from services.dependency_resolver import DependencyResolver
from services.field_mapper import FieldMapper
from services.condition_evaluator import ConditionEvaluator


class TestExecutor:
    """测试执行引擎"""
    
    def __init__(self, db: Session):
        self.db = db
        self.client = httpx.AsyncClient(timeout=30.0)
        self.field_mapper = FieldMapper()
        self.condition_evaluator = ConditionEvaluator()
    
    async def execute_test_case(
        self,
        test_case: TestCase,
        thread_count: int = 1,
        data_set: Optional[List[Dict[str, Any]]] = None,
        execution_id: Optional[int] = None
    ) -> TestExecution:
        """
        执行测试用例
        
        Args:
            test_case: 测试用例对象
            thread_count: 线程数
            data_set: 数据集（可选）
            execution_id: 已存在的执行记录ID（可选，如果提供则使用已有记录）
            
        Returns:
            测试执行记录
        """
        # 如果提供了execution_id，使用已存在的执行记录
        if execution_id:
            execution = self.db.query(TestExecution).filter(TestExecution.id == execution_id).first()
            if execution:
                execution.status = "running"
                execution.start_time = datetime.utcnow()
                self.db.commit()
                self.db.refresh(execution)
            else:
                # 如果找不到记录，创建新的
                execution = TestExecution(
                    test_case_id=test_case.id,
                    user_id=test_case.user_id,
                    status="running",
                    thread_count=thread_count,
                    start_time=datetime.utcnow()
                )
                self.db.add(execution)
                self.db.commit()
                self.db.refresh(execution)
        else:
            # 创建新的执行记录
            execution = TestExecution(
                test_case_id=test_case.id,
                user_id=test_case.user_id,
                status="running",
                thread_count=thread_count,
                start_time=datetime.utcnow()
            )
            self.db.add(execution)
            self.db.commit()
            self.db.refresh(execution)
        
        try:
            # 获取测试用例的API配置
            test_case_apis = self.db.query(TestCaseAPI).filter(
                TestCaseAPI.test_case_id == test_case.id
            ).order_by(TestCaseAPI.order).all()
            
            if not test_case_apis:
                execution.status = "failed"
                execution.error_message = "测试用例中没有配置API"
                execution.end_time = datetime.utcnow()
                self.db.commit()
                return execution
            
            # 解析依赖关系并确定执行顺序
            api_configs = [
                {
                    "api_id": tca.api_id,
                    "depends_on": tca.field_mappings.keys() if tca.field_mappings else []
                }
                for tca in test_case_apis
            ]
            
            resolver = DependencyResolver()
            order_result = resolver.resolve_execution_order(api_configs)
            
            if order_result["has_circular_dependency"]:
                execution.status = "failed"
                execution.error_message = "存在循环依赖，无法执行"
                execution.end_time = datetime.utcnow()
                self.db.commit()
                return execution
            
            # 按顺序执行API
            ordered_api_ids = order_result["ordered_apis"]
            api_map = {tca.api_id: tca for tca in test_case_apis}
            
            # 获取数据集字段映射配置
            data_set_field_mappings = test_case.data_set_field_mappings or []
            
            # 准备数据集
            if data_set is None:
                data_set = [{}]  # 默认使用空数据集
            
            total_requests = len(data_set) * len(ordered_api_ids)
            execution.total_requests = total_requests
            
            success_count = 0
            failure_count = 0
            previous_responses = {}  # 存储之前API的响应数据 {api_id: parsed_response}
            
            # 执行每个数据集的测试
            for data_item in data_set:
                # 每次数据集迭代，清空之前的响应（可选，取决于是否希望跨数据集共享响应）
                previous_responses = {}
                
                skip_remaining = False  # 标记是否跳过后续API
                
                for api_id in ordered_api_ids:
                    tca = api_map.get(api_id)
                    if not tca:
                        continue
                    
                    # 获取API信息
                    api = self.db.query(API).filter(API.id == api_id).first()
                    if not api:
                        failure_count += 1
                        continue
                    
                    # 如果设置了跳过后续API
                    if skip_remaining:
                        # 创建跳过记录
                        skip_result = TestExecutionResult(
                            execution_id=execution.id,
                            api_id=api.id,
                            order=tca.order,
                            status="skipped",
                            error_message="因前置条件不满足而跳过"
                        )
                        self.db.add(skip_result)
                        continue
                    
                    # 检查条件执行
                    should_exec, condition_msg, on_fail = self.condition_evaluator.should_execute(
                        tca.execution_condition,
                        previous_responses
                    )
                    
                    if not should_exec:
                        # 条件不满足，根据策略处理
                        if on_fail == "skip":
                            # 跳过当前API
                            skip_result = TestExecutionResult(
                                execution_id=execution.id,
                                api_id=api.id,
                                order=tca.order,
                                status="skipped",
                                error_message=f"条件不满足: {condition_msg}"
                            )
                            self.db.add(skip_result)
                            skip_remaining = True  # 后续API也跳过
                            continue
                        elif on_fail == "fail":
                            # 标记失败
                            fail_result = TestExecutionResult(
                                execution_id=execution.id,
                                api_id=api.id,
                                order=tca.order,
                                status="failure",
                                error_message=f"条件不满足: {condition_msg}"
                            )
                            self.db.add(fail_result)
                            failure_count += 1
                            skip_remaining = True  # 后续API也跳过
                            continue
                        # on_fail == "continue" 时继续执行
                    
                    # 执行API，传入数据集字段映射
                    result = await self._execute_api(
                        api, tca, data_item, previous_responses, execution.id,
                        data_set_field_mappings
                    )
                    
                    if result.status == "success":
                        success_count += 1
                        # 保存响应数据供后续API使用（解析为字典）
                        previous_responses[api_id] = self.field_mapper.parse_json_string(
                            result.response_body
                        )
                    else:
                        failure_count += 1
            
            execution.success_count = success_count
            execution.failure_count = failure_count
            execution.status = "completed" if failure_count == 0 else "failed"
            
        except Exception as e:
            execution.status = "failed"
            execution.error_message = str(e)
            failure_count += 1
        
        finally:
            execution.end_time = datetime.utcnow()
            if execution.start_time:
                execution.duration = (execution.end_time - execution.start_time).total_seconds()
            self.db.commit()
        
        return execution
    
    async def _execute_api(
        self,
        api: API,
        tca: TestCaseAPI,
        data_item: Dict[str, Any],
        previous_responses: Dict[int, Any],
        execution_id: int,
        data_set_field_mappings: List[Dict[str, Any]] = None
    ) -> TestExecutionResult:
        """执行单个API"""
        result = TestExecutionResult(
            execution_id=execution_id,
            api_id=api.id,
            order=tca.order,
            status="pending"
        )
        self.db.add(result)
        self.db.flush()
        
        try:
            # 应用等待时间
            if tca.wait_time > 0:
                await asyncio.sleep(tca.wait_time)
            
            # 构建请求URL和参数
            url = f"https://example.com{api.path}"  # 这里需要根据实际配置构建URL
            params = tca.request_params.copy() if tca.request_params else {}
            
            # 获取API级别的增强字段映射
            api_enhanced_mappings = tca.enhanced_field_mappings or []
            
            # 合并数据集字段映射和API增强字段映射
            all_mappings = []
            
            # 添加数据集字段映射（针对当前API的）
            if data_set_field_mappings:
                all_mappings.extend(data_set_field_mappings)
            
            # 添加API级别的增强字段映射
            if api_enhanced_mappings:
                all_mappings.extend(api_enhanced_mappings)
            
            # 应用字段映射
            if all_mappings or tca.field_mappings:
                # 优先使用新的增强字段映射
                if all_mappings:
                    params = self.field_mapper.apply_all_mappings(
                        params,
                        data_item,
                        previous_responses,
                        data_set_mappings=[m for m in all_mappings if m.get("source_type") == "data_set"],
                        api_mappings=[m for m in all_mappings if m.get("source_type") == "api"]
                    )
                
                # 兼容旧的字段映射格式
                if tca.field_mappings:
                    params = self._apply_legacy_field_mappings(
                        params, tca.field_mappings, previous_responses
                    )
            
            # 发送HTTP请求
            start_time = time.time()
            retry_count = 0
            max_retries = tca.retry_count
            
            while retry_count <= max_retries:
                try:
                    response = await self.client.request(
                        method=api.method,
                        url=url,
                        json=params,
                        timeout=tca.timeout if hasattr(tca, 'timeout') else 30
                    )
                    
                    response_time = (time.time() - start_time) * 1000
                    
                    result.status = "success" if response.status_code < 400 else "failure"
                    result.status_code = response.status_code
                    result.request_url = url
                    result.request_method = api.method
                    result.response_time = response_time
                    result.response_body = response.text[:1000]  # 限制长度
                    result.retry_count = retry_count
                    
                    if result.status == "success" or retry_count >= max_retries:
                        break
                    
                    # 等待重试间隔
                    if retry_count < max_retries:
                        await asyncio.sleep(tca.retry_interval)
                    
                    retry_count += 1
                    
                except Exception as e:
                    result.status = "failure"
                    result.error_message = str(e)
                    result.retry_count = retry_count
                    
                    if retry_count >= max_retries:
                        break
                    
                    retry_count += 1
                    await asyncio.sleep(tca.retry_interval)
            
        except Exception as e:
            result.status = "failure"
            result.error_message = str(e)
        
        finally:
            result.executed_at = datetime.utcnow()
            self.db.commit()
        
        return result
    
    def _apply_legacy_field_mappings(
        self,
        params: Dict[str, Any],
        field_mappings: Dict[str, Any],
        previous_responses: Dict[int, Any]
    ) -> Dict[str, Any]:
        """
        应用旧格式的字段映射（向后兼容）
        
        旧格式: {source_api_id: {source_field: target_field}}
        """
        if not field_mappings:
            return params
        
        result = params.copy() if params else {}
        
        for source_api_id_str, mappings in field_mappings.items():
            try:
                source_api_id = int(source_api_id_str)
            except (ValueError, TypeError):
                continue
            
            response_data = previous_responses.get(source_api_id)
            if response_data is None:
                continue
            
            # 确保响应数据是字典
            if isinstance(response_data, str):
                response_data = self.field_mapper.parse_json_string(response_data)
            
            if not isinstance(response_data, dict):
                continue
            
            if isinstance(mappings, dict):
                for source_field, target_field in mappings.items():
                    value = self.field_mapper.get_nested_value(response_data, source_field)
                    if value is not None:
                        result = self.field_mapper.set_nested_value(result, target_field, value)
        
        return result
    
    async def close(self):
        """关闭HTTP客户端"""
        await self.client.aclose()

