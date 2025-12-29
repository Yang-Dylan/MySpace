"""
测试用例管理路由
"""
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from core.database import get_db
from api.dependencies import get_current_active_user
from models.user import User
from models.test_case import TestCase, TestCaseAPI
from models.api_doc import API, APIDocument, GroupDataSet
from models.test_execution import TestDataSet
from schemas.test_case import (
    TestCaseCreate, TestCaseUpdate, TestCaseResponse, TestCaseDetailResponse, 
    TestCaseAPIResponse, FieldMappingItem, ExecutionCondition
)

router = APIRouter(prefix="/api/test-cases", tags=["test-cases"])


@router.post(
    "/",
    response_model=TestCaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建测试用例",
    description="基于API文档创建新的测试用例，支持数据集关联和字段映射"
)
async def create_test_case(
    test_case_data: TestCaseCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    创建测试用例
    
    从API文档中选择API并配置参数，生成测试用例。
    支持关联数据集和配置字段映射。
    """
    # 验证API是否存在
    if test_case_data.apis:
        for api_config in test_case_data.apis:
            api = db.query(API).filter(API.id == api_config.api_id).first()
            if not api:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"API with id {api_config.api_id} not found"
                )
    
    # 验证数据集是否存在（支持全局数据集和分组数据集）
    if test_case_data.data_set_id:
        # 先尝试查找全局数据集
        data_set = db.query(TestDataSet).filter(
            TestDataSet.id == test_case_data.data_set_id,
            TestDataSet.user_id == current_user.id
        ).first()
        
        # 如果没找到，尝试查找分组数据集
        if not data_set:
            data_set = db.query(GroupDataSet).filter(
                GroupDataSet.id == test_case_data.data_set_id
            ).first()
        
        # 如果都没找到，报错
        if not data_set:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Data set with id {test_case_data.data_set_id} not found"
            )
    
    # 转换数据集字段映射为JSON格式
    data_set_field_mappings_json = None
    if test_case_data.data_set_field_mappings:
        data_set_field_mappings_json = [m.dict() for m in test_case_data.data_set_field_mappings]
    
    # 创建测试用例
    db_test_case = TestCase(
        name=test_case_data.name,
        description=test_case_data.description,
        config=test_case_data.config,
        user_id=current_user.id,
        is_active=True,
        data_set_id=test_case_data.data_set_id,
        data_set_field_mappings=data_set_field_mappings_json
    )
    db.add(db_test_case)
    db.flush()  # 获取ID
    
    # 创建测试用例API配置
    for api_config in test_case_data.apis:
        # 转换增强字段映射为JSON格式
        enhanced_mappings_json = None
        if api_config.enhanced_field_mappings:
            enhanced_mappings_json = [m.dict() for m in api_config.enhanced_field_mappings]
        
        # 转换条件执行配置为JSON格式
        execution_condition_json = None
        if api_config.execution_condition:
            execution_condition_json = api_config.execution_condition.dict()
        
        db_test_case_api = TestCaseAPI(
            test_case_id=db_test_case.id,
            api_id=api_config.api_id,
            order=api_config.order,
            retry_count=api_config.retry_count,
            retry_interval=api_config.retry_interval,
            wait_time=api_config.wait_time,
            field_mappings=api_config.field_mappings,
            enhanced_field_mappings=enhanced_mappings_json,
            request_params=api_config.request_params,
            execution_condition=execution_condition_json
        )
        db.add(db_test_case_api)
    
    db.commit()
    db.refresh(db_test_case)
    
    return db_test_case


@router.get(
    "/",
    response_model=List[TestCaseResponse],
    summary="获取测试用例列表",
    description="获取当前用户的所有测试用例列表"
)
async def list_test_cases(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取测试用例列表"""
    test_cases = db.query(TestCase).filter(
        TestCase.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return test_cases


@router.get(
    "/{test_case_id}",
    response_model=TestCaseDetailResponse,
    summary="获取测试用例详情",
    description="获取测试用例的详细信息，包括API配置和数据集字段映射"
)
async def get_test_case(
    test_case_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取测试用例详情"""
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.user_id == current_user.id
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    # 获取关联的API配置
    test_case_apis = db.query(TestCaseAPI).filter(
        TestCaseAPI.test_case_id == test_case_id
    ).order_by(TestCaseAPI.order).all()
    
    # 转换数据集字段映射
    data_set_field_mappings = None
    if test_case.data_set_field_mappings:
        data_set_field_mappings = [
            FieldMappingItem(**m) for m in test_case.data_set_field_mappings
        ]
    
    # 构建响应
    response_data = {
        "id": test_case.id,
        "name": test_case.name,
        "description": test_case.description,
        "config": test_case.config,
        "user_id": test_case.user_id,
        "is_active": test_case.is_active,
        "created_at": test_case.created_at,
        "updated_at": test_case.updated_at,
        "data_set_id": test_case.data_set_id,
        "data_set_field_mappings": data_set_field_mappings,
        "apis": [TestCaseAPIResponse.from_orm(tca).dict() for tca in test_case_apis]
    }
    
    return response_data


@router.put(
    "/{test_case_id}",
    response_model=TestCaseResponse,
    summary="更新测试用例",
    description="更新测试用例的配置、API列表和数据集字段映射"
)
async def update_test_case(
    test_case_id: int,
    test_case_update: TestCaseUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新测试用例"""
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.user_id == current_user.id
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    # 验证数据集是否存在（支持全局数据集和分组数据集）
    if test_case_update.data_set_id:
        # 先尝试查找全局数据集
        data_set = db.query(TestDataSet).filter(
            TestDataSet.id == test_case_update.data_set_id,
            TestDataSet.user_id == current_user.id
        ).first()
        
        # 如果没找到，尝试查找分组数据集
        if not data_set:
            data_set = db.query(GroupDataSet).filter(
                GroupDataSet.id == test_case_update.data_set_id
            ).first()
        
        # 如果都没找到，报错
        if not data_set:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Data set with id {test_case_update.data_set_id} not found"
            )
    
    # 更新基本信息
    update_data = test_case_update.dict(exclude_unset=True, exclude={"apis", "data_set_field_mappings"})
    for field, value in update_data.items():
        setattr(test_case, field, value)
    
    # 更新数据集字段映射
    if test_case_update.data_set_field_mappings is not None:
        test_case.data_set_field_mappings = [m.dict() for m in test_case_update.data_set_field_mappings]
    
    # 如果提供了新的API列表，更新API配置
    if test_case_update.apis is not None:
        # 删除旧的API配置
        db.query(TestCaseAPI).filter(TestCaseAPI.test_case_id == test_case_id).delete()
        
        # 添加新的API配置
        for api_config in test_case_update.apis:
            # 验证API是否存在
            api = db.query(API).filter(API.id == api_config.api_id).first()
            if not api:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"API with id {api_config.api_id} not found"
                )
            
            # 转换增强字段映射为JSON格式
            enhanced_mappings_json = None
            if api_config.enhanced_field_mappings:
                enhanced_mappings_json = [m.dict() for m in api_config.enhanced_field_mappings]
            
            # 转换条件执行配置为JSON格式
            execution_condition_json = None
            if api_config.execution_condition:
                execution_condition_json = api_config.execution_condition.dict()
            
            db_test_case_api = TestCaseAPI(
                test_case_id=test_case_id,
                api_id=api_config.api_id,
                order=api_config.order,
                retry_count=api_config.retry_count,
                retry_interval=api_config.retry_interval,
                wait_time=api_config.wait_time,
                field_mappings=api_config.field_mappings,
                enhanced_field_mappings=enhanced_mappings_json,
                request_params=api_config.request_params,
                execution_condition=execution_condition_json
            )
            db.add(db_test_case_api)
    
    db.commit()
    db.refresh(test_case)
    return test_case


@router.delete(
    "/{test_case_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除测试用例",
    description="删除指定的测试用例"
)
async def delete_test_case(
    test_case_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除测试用例"""
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.user_id == current_user.id
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    db.delete(test_case)
    db.commit()
    return None


@router.post(
    "/{test_case_id}/validate",
    summary="验证测试用例",
    description="验证测试用例配置的有效性"
)
async def validate_test_case(
    test_case_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """验证测试用例配置"""
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.user_id == current_user.id
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    # 获取API配置
    test_case_apis = db.query(TestCaseAPI).filter(
        TestCaseAPI.test_case_id == test_case_id
    ).all()
    
    errors = []
    warnings = []
    
    # 验证API是否存在
    for tca in test_case_apis:
        api = db.query(API).filter(API.id == tca.api_id).first()
        if not api:
            errors.append(f"API with id {tca.api_id} not found")
    
    # 验证执行顺序
    orders = [tca.order for tca in test_case_apis]
    if len(orders) != len(set(orders)):
        warnings.append("存在重复的执行顺序")
    
    # 验证字段映射
    for tca in test_case_apis:
        if tca.field_mappings:
            # 检查字段映射的源API是否存在
            for source_api_id in tca.field_mappings.keys():
                source_api = db.query(API).filter(API.id == int(source_api_id)).first()
                if not source_api:
                    errors.append(f"字段映射中引用的API {source_api_id} 不存在")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }


@router.post(
    "/{test_case_id}/validate-params",
    summary="校验用例参数配置",
    description="校验用例中所有API的必需请求参数是否都已配置源数据"
)
async def validate_test_case_params(
    test_case_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """校验用例参数配置"""
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.user_id == current_user.id
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    # 获取API配置
    test_case_apis = db.query(TestCaseAPI).filter(
        TestCaseAPI.test_case_id == test_case_id
    ).order_by(TestCaseAPI.order).all()
    
    missing_params = []  # 未配置的参数列表
    
    for tca in test_case_apis:
        api = db.query(API).filter(API.id == tca.api_id).first()
        if not api:
            continue
        
        # 获取API的请求参数
        request_params = api.parsed_request_params or []
        if not request_params:
            continue
        
        # 获取已配置的字段映射
        configured_target_fields = set()
        if tca.enhanced_field_mappings:
            for mapping in tca.enhanced_field_mappings:
                if mapping.get('target_field'):
                    configured_target_fields.add(mapping['target_field'])
        
        # 检查必需参数是否都已配置
        for param in request_params:
            param_path = param.get('path', '')
            param_required = param.get('required', False)
            
            # 只检查必需参数
            if param_required and param_path:
                # 检查是否已配置映射
                if param_path not in configured_target_fields:
                    missing_params.append({
                        'api_id': api.id,
                        'api_order': tca.order,
                        'api_method': api.method,
                        'api_path': api.path,
                        'api_summary': api.summary,
                        'param_path': param_path,
                        'param_name': param.get('name', ''),
                        'param_type': param.get('type', 'string')
                    })
    
    return {
        "valid": len(missing_params) == 0,
        "missing_params": missing_params
    }
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }


# ==================== 可视化数据模型 ====================

class VisualAPIParam(BaseModel):
    """可视化参数"""
    name: str = Field(..., description="参数名称")
    path: str = Field(..., description="参数路径")
    type: str = Field("string", description="参数类型")
    is_mapped: bool = Field(False, description="是否有映射")
    mapping_source: Optional[str] = Field(None, description="映射来源描述")


class VisualFieldMapping(BaseModel):
    """可视化字段映射"""
    source_api_order: Optional[int] = Field(None, description="源API序号（当source_type为api时）")
    source_field: str = Field(..., description="源字段路径")
    target_field: str = Field(..., description="目标字段路径")
    source_type: str = Field(default="api", description="源类型：api（来自其他API响应）或 data_set（来自数据集）")
    source_data_set_id: Optional[int] = Field(None, description="数据集ID（当source_type为data_set时）")


class VisualAPINode(BaseModel):
    """可视化API节点"""
    id: int = Field(..., description="API ID")
    order: int = Field(..., description="执行顺序")
    method: str = Field(..., description="HTTP方法")
    path: str = Field(..., description="API路径")
    summary: Optional[str] = Field(None, description="API摘要")
    key_params: List[VisualAPIParam] = Field([], description="关键参数（最多3个）")
    all_params: List[VisualAPIParam] = Field([], description="全部参数")
    has_condition: bool = Field(False, description="是否有条件执行")
    condition: Optional[ExecutionCondition] = Field(None, description="条件配置")
    incoming_mappings: List[VisualFieldMapping] = Field([], description="入向字段映射")


class TestCaseVisualResponse(BaseModel):
    """用例可视化响应"""
    id: int = Field(..., description="用例ID")
    name: str = Field(..., description="用例名称")
    description: Optional[str] = Field(None, description="用例描述")
    nodes: List[VisualAPINode] = Field([], description="API节点列表")
    has_data_set: bool = Field(False, description="是否关联数据集")
    data_set_name: Optional[str] = Field(None, description="数据集名称")


@router.get(
    "/{test_case_id}/visual",
    response_model=TestCaseVisualResponse,
    summary="获取用例可视化数据",
    description="获取测试用例的可视化展示数据，包含API节点、字段映射和条件配置"
)
async def get_test_case_visual(
    test_case_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取用例可视化数据
    
    返回结构化的数据用于可视化展示：
    - API节点列表（按执行顺序排序）
    - 每个节点的关键参数（最多3个）
    - 节点间的字段映射关系
    - 条件执行配置
    """
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.user_id == current_user.id
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    # 获取API配置
    test_case_apis = db.query(TestCaseAPI).filter(
        TestCaseAPI.test_case_id == test_case_id
    ).order_by(TestCaseAPI.order).all()
    
    # 构建API ID到order的映射
    api_id_to_order = {tca.api_id: tca.order for tca in test_case_apis}
    
    # 构建节点列表
    nodes = []
    for tca in test_case_apis:
        api = db.query(API).filter(API.id == tca.api_id).first()
        if not api:
            continue
        
        # 解析参数
        all_params = []
        request_params = api.parsed_request_params or []
        response_params = api.parsed_response_params or []
        
        # 添加请求参数
        for param in request_params:
            if isinstance(param, dict):
                all_params.append(VisualAPIParam(
                    name=param.get("name", ""),
                    path=param.get("path", ""),
                    type=param.get("type", "string"),
                    is_mapped=False
                ))
        
        # 检查字段映射，标记被映射的参数
        incoming_mappings = []
        
        # 处理增强字段映射
        if tca.enhanced_field_mappings:
            for mapping in tca.enhanced_field_mappings:
                if isinstance(mapping, dict):
                    source_type = mapping.get("source_type", "api")
                    if source_type == "api":
                        source_api_id = mapping.get("source_api_id")
                        source_order = api_id_to_order.get(source_api_id, 0)
                        incoming_mappings.append(VisualFieldMapping(
                            source_api_order=source_order,
                            source_field=mapping.get("source_field", ""),
                            target_field=mapping.get("target_field", ""),
                            source_type="api",
                            source_data_set_id=None
                        ))
                        # 标记参数为已映射
                        for param in all_params:
                            if param.path == mapping.get("target_field"):
                                param.is_mapped = True
                                param.mapping_source = f"API #{source_order}"
                    elif source_type == "data_set":
                        source_data_set_id = mapping.get("source_api_id")  # 在数据集映射中，source_api_id存储的是数据集ID
                        incoming_mappings.append(VisualFieldMapping(
                            source_api_order=None,
                            source_field=mapping.get("source_field", ""),
                            target_field=mapping.get("target_field", ""),
                            source_type="data_set",
                            source_data_set_id=source_data_set_id
                        ))
                        # 标记参数为已映射
                        for param in all_params:
                            if param.path == mapping.get("target_field"):
                                param.is_mapped = True
                                param.mapping_source = "数据集"
        
        # 处理数据集字段映射
        if test_case.data_set_field_mappings:
            for mapping in test_case.data_set_field_mappings:
                if isinstance(mapping, dict):
                    for param in all_params:
                        if param.path == mapping.get("target_field"):
                            param.is_mapped = True
                            param.mapping_source = "数据集"
        
        # 选取关键参数（最多3个，优先已映射的）
        key_params = sorted(all_params, key=lambda p: (not p.is_mapped, p.name))[:3]
        
        # 解析条件配置
        has_condition = False
        condition = None
        if tca.execution_condition:
            ec = tca.execution_condition
            if isinstance(ec, dict) and ec.get("enabled"):
                has_condition = True
                condition = ExecutionCondition(**ec)
        
        nodes.append(VisualAPINode(
            id=api.id,
            order=tca.order,
            method=api.method,
            path=api.path,
            summary=api.summary,
            key_params=key_params,
            all_params=all_params,
            has_condition=has_condition,
            condition=condition,
            incoming_mappings=incoming_mappings
        ))
    
    # 获取数据集信息（支持全局数据集和分组数据集）
    has_data_set = False
    data_set_name = None
    if test_case.data_set_id:
        # 先尝试查找全局数据集
        data_set = db.query(TestDataSet).filter(
            TestDataSet.id == test_case.data_set_id
        ).first()
        
        # 如果没找到，尝试查找分组数据集
        if not data_set:
            data_set = db.query(GroupDataSet).filter(
                GroupDataSet.id == test_case.data_set_id
            ).first()
        
        if data_set:
            has_data_set = True
            data_set_name = data_set.name
    
    return TestCaseVisualResponse(
        id=test_case.id,
        name=test_case.name,
        description=test_case.description,
        nodes=nodes,
        has_data_set=has_data_set,
        data_set_name=data_set_name
    )


# ==================== 用例执行记录 ====================

from datetime import datetime
from models.test_execution import TestExecution


class TestCaseExecutionRecord(BaseModel):
    """用例执行记录"""
    id: int = Field(..., description="执行ID")
    status: str = Field(..., description="执行状态")
    total_requests: int = Field(0, description="总请求数")
    success_count: int = Field(0, description="成功数")
    failure_count: int = Field(0, description="失败数")
    duration: Optional[float] = Field(None, description="执行时长（秒）")
    error_message: Optional[str] = Field(None, description="错误信息")
    created_at: datetime = Field(..., description="创建时间")
    start_time: Optional[datetime] = Field(None, description="开始时间")
    end_time: Optional[datetime] = Field(None, description="结束时间")


class TestCaseExecutionsResponse(BaseModel):
    """用例执行记录列表响应"""
    items: List[TestCaseExecutionRecord] = Field(..., description="执行记录列表")
    total: int = Field(..., description="总数")


@router.get(
    "/{test_case_id}/executions",
    response_model=TestCaseExecutionsResponse,
    summary="获取用例执行记录",
    description="获取指定用例的历史执行记录列表"
)
async def get_test_case_executions(
    test_case_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取用例执行记录
    
    返回指定用例的最近执行记录列表，默认返回最近10条。
    """
    # 验证用例存在且属于当前用户
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.user_id == current_user.id
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="测试用例不存在"
        )
    
    # 查询执行记录
    executions = db.query(TestExecution).filter(
        TestExecution.test_case_id == test_case_id,
        TestExecution.user_id == current_user.id
    ).order_by(TestExecution.created_at.desc()).limit(limit).all()
    
    total = db.query(TestExecution).filter(
        TestExecution.test_case_id == test_case_id,
        TestExecution.user_id == current_user.id
    ).count()
    
    items = [
        TestCaseExecutionRecord(
            id=e.id,
            status=e.status,
            total_requests=e.total_requests or 0,
            success_count=e.success_count or 0,
            failure_count=e.failure_count or 0,
            duration=e.duration,
            error_message=e.error_message,
            created_at=e.created_at,
            start_time=e.start_time,
            end_time=e.end_time
        )
        for e in executions
    ]
    
    return TestCaseExecutionsResponse(items=items, total=total)

