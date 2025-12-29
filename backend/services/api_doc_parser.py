"""
API文档解析服务
"""
import yaml
import json
from typing import Dict, List, Any, Optional


class APIDocParser:
    """API文档解析器"""
    
    def __init__(self):
        self._components = {}  # 存储组件定义供引用解析
    
    def parse_openapi(self, content: str) -> List[Dict[str, Any]]:
        """解析OpenAPI文档"""
        try:
            # 尝试解析为JSON
            try:
                doc = json.loads(content)
            except json.JSONDecodeError:
                # 如果不是JSON，尝试解析为YAML
                doc = yaml.safe_load(content)
            
            # 保存组件定义
            self._components = doc.get("components", {}).get("schemas", {})
            
            apis = []
            paths = doc.get("paths", {})
            
            for path, methods in paths.items():
                for method, details in methods.items():
                    if method.upper() in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
                        api_data = {
                            "method": method.upper(),
                            "path": path,
                            "summary": details.get("summary", ""),
                            "description": details.get("description", ""),
                            "request_schema": json.dumps(details.get("requestBody", {})),
                            "response_schema": json.dumps(details.get("responses", {})),
                            "parameters": details.get("parameters", []),
                            "requestBody": details.get("requestBody", {}),
                            "responses": details.get("responses", {}),
                            "tags": details.get("tags", [])
                        }
                        apis.append(api_data)
            
            return apis
        except Exception as e:
            raise ValueError(f"Failed to parse OpenAPI document: {str(e)}")
    
    def extract_request_params(self, api_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        从API数据中提取请求参数
        
        提取来源：
        1. parameters - 路径参数、查询参数、头部参数
        2. requestBody - 请求体参数
        """
        params = []
        
        # 1. 提取 parameters（路径参数、查询参数等）
        parameters = api_data.get("parameters", [])
        for param in parameters:
            param_info = {
                "name": param.get("name", ""),
                "path": f"{param.get('in', 'query')}.{param.get('name', '')}",
                "type": self._get_param_type(param.get("schema", {})),
                "required": param.get("required", False),
                "description": param.get("description", ""),
                "example": param.get("example")
            }
            params.append(param_info)
        
        # 2. 提取 requestBody
        request_body = api_data.get("requestBody", {})
        if request_body:
            content = request_body.get("content", {})
            # 优先处理 JSON 格式
            json_content = content.get("application/json", {})
            if json_content:
                schema = json_content.get("schema", {})
                body_params = self._extract_schema_params(schema, "body")
                params.extend(body_params)
            
            # 处理 form-data 格式
            form_content = content.get("multipart/form-data", {}) or content.get("application/x-www-form-urlencoded", {})
            if form_content:
                schema = form_content.get("schema", {})
                form_params = self._extract_schema_params(schema, "form")
                params.extend(form_params)
        
        return params
    
    def extract_response_params(self, api_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        从API数据中提取响应参数
        
        主要提取200/201成功响应的参数
        """
        params = []
        
        responses = api_data.get("responses", {})
        
        # 优先处理成功响应
        success_codes = ["200", "201", "default"]
        for code in success_codes:
            response = responses.get(code, {})
            if response:
                content = response.get("content", {})
                json_content = content.get("application/json", {})
                if json_content:
                    schema = json_content.get("schema", {})
                    response_params = self._extract_schema_params(schema, "response")
                    params.extend(response_params)
                    break  # 只取第一个成功响应
        
        return params
    
    def _extract_schema_params(self, schema: Dict[str, Any], prefix: str) -> List[Dict[str, Any]]:
        """从JSON Schema中提取参数列表"""
        params = []
        
        # 处理 $ref 引用
        if "$ref" in schema:
            ref_path = schema["$ref"]
            schema = self._resolve_ref(ref_path)
        
        # 处理对象类型
        if schema.get("type") == "object" or "properties" in schema:
            properties = schema.get("properties", {})
            required_fields = schema.get("required", [])
            
            for prop_name, prop_schema in properties.items():
                # 递归处理嵌套对象
                if prop_schema.get("type") == "object" or "properties" in prop_schema:
                    nested_params = self._extract_schema_params(prop_schema, f"{prefix}.{prop_name}")
                    params.extend(nested_params)
                else:
                    param_info = {
                        "name": prop_name,
                        "path": f"{prefix}.{prop_name}",
                        "type": self._get_param_type(prop_schema),
                        "required": prop_name in required_fields,
                        "description": prop_schema.get("description", ""),
                        "example": prop_schema.get("example")
                    }
                    params.append(param_info)
        
        # 处理数组类型
        elif schema.get("type") == "array":
            items = schema.get("items", {})
            item_params = self._extract_schema_params(items, f"{prefix}[]")
            params.extend(item_params)
        
        return params
    
    def _resolve_ref(self, ref_path: str) -> Dict[str, Any]:
        """解析 $ref 引用"""
        if ref_path.startswith("#/components/schemas/"):
            schema_name = ref_path.replace("#/components/schemas/", "")
            return self._components.get(schema_name, {})
        return {}
    
    def _get_param_type(self, schema: Dict[str, Any]) -> str:
        """获取参数类型"""
        if "$ref" in schema:
            ref_path = schema["$ref"]
            if ref_path.startswith("#/components/schemas/"):
                return ref_path.replace("#/components/schemas/", "")
            return "object"
        
        param_type = schema.get("type", "string")
        
        # 处理格式说明
        format_type = schema.get("format")
        if format_type:
            if format_type == "int64":
                return "integer"
            elif format_type == "date-time":
                return "datetime"
            elif format_type == "date":
                return "date"
        
        return param_type
    
    @staticmethod
    def parse_swagger(content: str) -> List[Dict[str, Any]]:
        """解析Swagger文档（兼容OpenAPI 2.0）"""
        parser = APIDocParser()
        return parser.parse_openapi(content)

