"""
条件执行评估服务

用于评估测试用例中API的条件执行配置
"""
from typing import Dict, Any, List, Optional, Tuple
import json


class ConditionEvaluator:
    """条件执行评估器"""
    
    # 支持的运算符
    OPERATORS = {
        "equals": lambda a, b: a == b,
        "not_equals": lambda a, b: a != b,
        "contains": lambda a, b: b in str(a) if a is not None else False,
        "not_contains": lambda a, b: b not in str(a) if a is not None else True,
        "gt": lambda a, b: float(a) > float(b) if a is not None and b is not None else False,
        "gte": lambda a, b: float(a) >= float(b) if a is not None and b is not None else False,
        "lt": lambda a, b: float(a) < float(b) if a is not None and b is not None else False,
        "lte": lambda a, b: float(a) <= float(b) if a is not None and b is not None else False,
        "exists": lambda a, _: a is not None,
        "not_exists": lambda a, _: a is None,
        "is_empty": lambda a, _: a is None or a == "" or a == [] or a == {},
        "not_empty": lambda a, _: a is not None and a != "" and a != [] and a != {},
    }
    
    def get_nested_value(self, data: Dict[str, Any], path: str) -> Any:
        """
        从嵌套字典中获取值
        
        Args:
            data: 数据字典
            path: 点分隔的路径，如 "data.user.id"
            
        Returns:
            获取的值，不存在则返回None
        """
        if not data or not path:
            return None
        
        keys = path.split(".")
        current = data
        
        for key in keys:
            if isinstance(current, dict):
                current = current.get(key)
            elif isinstance(current, list) and key.isdigit():
                idx = int(key)
                current = current[idx] if 0 <= idx < len(current) else None
            else:
                return None
            
            if current is None:
                return None
        
        return current
    
    def evaluate_single_condition(
        self,
        condition: Dict[str, Any],
        previous_responses: Dict[int, Any]
    ) -> Tuple[bool, str]:
        """
        评估单个条件
        
        Args:
            condition: 条件配置
            previous_responses: 之前API的响应数据
            
        Returns:
            (是否满足, 评估消息)
        """
        source_api_id = condition.get("source_api_id")
        field_path = condition.get("field_path")
        operator = condition.get("operator")
        expected_value = condition.get("value")
        
        # 验证条件配置
        if not source_api_id or not field_path or not operator:
            return False, "条件配置不完整"
        
        if operator not in self.OPERATORS:
            return False, f"不支持的运算符: {operator}"
        
        # 获取源API的响应数据
        response_data = previous_responses.get(source_api_id)
        if response_data is None:
            return False, f"未找到API {source_api_id} 的响应数据"
        
        # 确保响应数据是字典
        if isinstance(response_data, str):
            try:
                response_data = json.loads(response_data)
            except json.JSONDecodeError:
                return False, "响应数据不是有效的JSON"
        
        # 获取字段值
        actual_value = self.get_nested_value(response_data, field_path)
        
        # 执行比较
        try:
            operator_func = self.OPERATORS[operator]
            result = operator_func(actual_value, expected_value)
            
            if result:
                return True, f"条件满足: {field_path} {operator} {expected_value}"
            else:
                return False, f"条件不满足: {field_path}={actual_value}, 期望 {operator} {expected_value}"
                
        except Exception as e:
            return False, f"条件评估失败: {str(e)}"
    
    def evaluate_conditions(
        self,
        execution_condition: Dict[str, Any],
        previous_responses: Dict[int, Any]
    ) -> Tuple[bool, str, str]:
        """
        评估条件配置
        
        Args:
            execution_condition: 条件执行配置
            previous_responses: 之前API的响应数据
            
        Returns:
            (是否满足条件, 评估结果描述, 失败处理策略)
        """
        if not execution_condition:
            return True, "无条件配置", "continue"
        
        enabled = execution_condition.get("enabled", False)
        if not enabled:
            return True, "条件执行未启用", "continue"
        
        conditions = execution_condition.get("conditions", [])
        if not conditions:
            return True, "无条件规则", "continue"
        
        logic = execution_condition.get("logic", "AND")
        on_fail = execution_condition.get("on_fail", "skip")
        
        results = []
        messages = []
        
        for condition in conditions:
            satisfied, message = self.evaluate_single_condition(condition, previous_responses)
            results.append(satisfied)
            messages.append(message)
        
        # 根据逻辑组合评估结果
        if logic == "AND":
            all_satisfied = all(results)
            combined_message = " AND ".join(messages)
            return all_satisfied, combined_message, on_fail
        else:  # OR
            any_satisfied = any(results)
            combined_message = " OR ".join(messages)
            return any_satisfied, combined_message, on_fail
    
    def should_execute(
        self,
        execution_condition: Optional[Dict[str, Any]],
        previous_responses: Dict[int, Any]
    ) -> Tuple[bool, str, str]:
        """
        判断是否应该执行API
        
        Args:
            execution_condition: 条件执行配置
            previous_responses: 之前API的响应数据
            
        Returns:
            (是否执行, 原因描述, 失败处理策略)
        """
        if not execution_condition:
            return True, "", "continue"
        
        satisfied, message, on_fail = self.evaluate_conditions(
            execution_condition, previous_responses
        )
        
        if satisfied:
            return True, message, "continue"
        else:
            return False, message, on_fail

