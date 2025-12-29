"""
字段映射服务
"""
import json
from typing import Dict, Any, Optional, List


class FieldMapper:
    """字段映射处理器"""
    
    @staticmethod
    def get_nested_value(data: Dict[str, Any], path: str) -> Any:
        """
        从嵌套字典中根据路径获取值
        
        Args:
            data: 源数据字典
            path: 字段路径，如 "data.user.id"
            
        Returns:
            路径对应的值，如果路径不存在返回None
        """
        if not data or not path:
            return None
        
        keys = path.split(".")
        current = data
        
        for key in keys:
            if isinstance(current, dict):
                current = current.get(key)
            elif isinstance(current, list) and key.isdigit():
                index = int(key)
                if 0 <= index < len(current):
                    current = current[index]
                else:
                    return None
            else:
                return None
            
            if current is None:
                return None
        
        return current
    
    @staticmethod
    def set_nested_value(data: Dict[str, Any], path: str, value: Any) -> Dict[str, Any]:
        """
        在嵌套字典中根据路径设置值
        
        Args:
            data: 目标数据字典
            path: 字段路径，如 "body.userId"
            value: 要设置的值
            
        Returns:
            更新后的字典
        """
        if not path:
            return data
        
        keys = path.split(".")
        current = data
        
        for i, key in enumerate(keys[:-1]):
            if key not in current or not isinstance(current[key], dict):
                current[key] = {}
            current = current[key]
        
        current[keys[-1]] = value
        return data
    
    @staticmethod
    def parse_json_string(data: Any) -> Any:
        """
        尝试解析JSON字符串
        
        Args:
            data: 可能是JSON字符串或普通数据
            
        Returns:
            解析后的数据
        """
        if isinstance(data, str):
            try:
                return json.loads(data)
            except (json.JSONDecodeError, ValueError):
                return data
        return data
    
    def apply_data_set_mappings(
        self,
        request_params: Dict[str, Any],
        data_item: Dict[str, Any],
        mappings: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        应用数据集字段映射
        
        Args:
            request_params: 原始请求参数
            data_item: 数据集中的一条数据
            mappings: 字段映射配置列表
            
        Returns:
            应用映射后的请求参数
        """
        if not mappings or not data_item:
            return request_params
        
        result = request_params.copy() if request_params else {}
        
        for mapping in mappings:
            source_type = mapping.get("source_type", "data_set")
            if source_type != "data_set":
                continue
            
            source_field = mapping.get("source_field", "")
            target_field = mapping.get("target_field", "")
            
            if not source_field or not target_field:
                continue
            
            # 从数据集中获取值
            value = self.get_nested_value(data_item, source_field)
            
            if value is not None:
                # 设置到目标位置
                result = self.set_nested_value(result, target_field, value)
        
        return result
    
    def apply_api_response_mappings(
        self,
        request_params: Dict[str, Any],
        previous_responses: Dict[int, Any],
        mappings: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        应用API响应字段映射
        
        Args:
            request_params: 原始请求参数
            previous_responses: 之前API的响应数据 {api_id: response_data}
            mappings: 字段映射配置列表
            
        Returns:
            应用映射后的请求参数
        """
        if not mappings or not previous_responses:
            return request_params
        
        result = request_params.copy() if request_params else {}
        
        for mapping in mappings:
            source_type = mapping.get("source_type", "api")
            if source_type != "api":
                continue
            
            source_api_id = mapping.get("source_api_id")
            source_field = mapping.get("source_field", "")
            target_field = mapping.get("target_field", "")
            
            if source_api_id is None or not source_field or not target_field:
                continue
            
            # 从之前的API响应中获取数据
            response_data = previous_responses.get(source_api_id)
            if response_data is None:
                continue
            
            # 解析JSON字符串
            response_data = self.parse_json_string(response_data)
            
            if not isinstance(response_data, dict):
                continue
            
            # 从响应中获取值
            value = self.get_nested_value(response_data, source_field)
            
            if value is not None:
                # 设置到目标位置
                result = self.set_nested_value(result, target_field, value)
        
        return result
    
    def apply_all_mappings(
        self,
        request_params: Dict[str, Any],
        data_item: Dict[str, Any],
        previous_responses: Dict[int, Any],
        data_set_mappings: Optional[List[Dict[str, Any]]] = None,
        api_mappings: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        应用所有字段映射（数据集映射和API响应映射）
        
        根据设计文档，API响应映射优先级高于数据集映射
        
        Args:
            request_params: 原始请求参数
            data_item: 数据集中的一条数据
            previous_responses: 之前API的响应数据
            data_set_mappings: 数据集字段映射配置
            api_mappings: API响应字段映射配置
            
        Returns:
            应用所有映射后的请求参数
        """
        result = request_params.copy() if request_params else {}
        
        # 首先应用数据集映射（较低优先级）
        if data_set_mappings:
            result = self.apply_data_set_mappings(result, data_item, data_set_mappings)
        
        # 然后应用API响应映射（较高优先级，会覆盖数据集映射）
        if api_mappings:
            result = self.apply_api_response_mappings(result, previous_responses, api_mappings)
        
        return result
    
    def validate_mappings(
        self,
        mappings: List[Dict[str, Any]],
        available_api_ids: List[int],
        data_set_fields: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        验证字段映射配置
        
        Args:
            mappings: 字段映射配置列表
            available_api_ids: 可用的API ID列表
            data_set_fields: 数据集中的字段列表（可选）
            
        Returns:
            验证结果 {"valid": bool, "errors": list, "warnings": list}
        """
        errors = []
        warnings = []
        
        for i, mapping in enumerate(mappings):
            source_type = mapping.get("source_type", "")
            source_field = mapping.get("source_field", "")
            target_field = mapping.get("target_field", "")
            
            if not source_field:
                errors.append(f"映射 #{i+1}: 缺少源字段")
            
            if not target_field:
                errors.append(f"映射 #{i+1}: 缺少目标字段")
            
            if source_type == "api":
                source_api_id = mapping.get("source_api_id")
                if source_api_id is None:
                    errors.append(f"映射 #{i+1}: API映射缺少源API ID")
                elif source_api_id not in available_api_ids:
                    errors.append(f"映射 #{i+1}: 源API ID {source_api_id} 不存在")
            
            elif source_type == "data_set":
                if data_set_fields and source_field.split(".")[0] not in data_set_fields:
                    warnings.append(f"映射 #{i+1}: 数据集中可能不存在字段 {source_field}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

