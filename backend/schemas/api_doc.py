"""
API文档相关的Pydantic模式
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


# ==================== API分组 ====================

class APIGroupBase(BaseModel):
    """API分组基础模式"""
    name: str = Field(..., description="分组名称", example="用户管理模块")
    description: Optional[str] = Field(None, description="分组描述")


class APIGroupCreate(APIGroupBase):
    """创建API分组模式"""
    pass


class APIGroupUpdate(BaseModel):
    """更新API分组模式"""
    name: Optional[str] = Field(None, description="分组名称")
    description: Optional[str] = Field(None, description="分组描述")


class APIGroupResponse(APIGroupBase):
    """API分组响应模式"""
    id: int = Field(..., description="分组ID")
    user_id: int = Field(..., description="创建用户ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")
    
    class Config:
        from_attributes = True


# ==================== API参数 ====================

class APIParam(BaseModel):
    """API参数模式"""
    name: str = Field(..., description="参数名称", example="userId")
    path: str = Field(..., description="参数路径", example="body.userId")
    type: str = Field("string", description="参数类型", example="integer")
    required: bool = Field(False, description="是否必填")
    description: Optional[str] = Field(None, description="参数描述")
    example: Optional[Any] = Field(None, description="示例值")


# ==================== API文档 ====================

class APIDocumentBase(BaseModel):
    """API文档基础模式"""
    name: str = Field(..., description="文档名称", example="用户管理API")
    description: Optional[str] = Field(None, description="文档描述")
    format: Optional[str] = Field(None, description="文档格式", example="OpenAPI")


class APIDocumentCreate(APIDocumentBase):
    """创建API文档模式"""
    content: str = Field(..., description="文档内容（JSON/YAML格式）")
    group_id: Optional[int] = Field(None, description="所属分组ID")


class APIDocumentUpdate(BaseModel):
    """更新API文档模式"""
    name: Optional[str] = Field(None, description="文档名称")
    description: Optional[str] = Field(None, description="文档描述")
    content: Optional[str] = Field(None, description="文档内容")
    group_id: Optional[int] = Field(None, description="所属分组ID")


class APIDocumentResponse(APIDocumentBase):
    """API文档响应模式"""
    id: int = Field(..., description="文档ID")
    user_id: int = Field(..., description="创建用户ID")
    group_id: Optional[int] = Field(None, description="所属分组ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")
    
    class Config:
        from_attributes = True


# ==================== API ====================

class APIBase(BaseModel):
    """API基础模式"""
    method: str = Field(..., description="HTTP方法", example="GET")
    path: str = Field(..., description="API路径", example="/api/users/{id}")
    summary: Optional[str] = Field(None, description="API简介")
    description: Optional[str] = Field(None, description="API详细描述")


class APICreate(APIBase):
    """创建API模式（手动添加时使用）"""
    document_id: int = Field(..., description="所属文档ID")
    tags: Optional[List[str]] = Field(None, description="API标签列表", example=["token", "auth"])
    parsed_request_params: Optional[List[APIParam]] = Field(None, description="请求参数列表")
    parsed_response_params: Optional[List[APIParam]] = Field(None, description="响应参数列表")


class APIUpdate(BaseModel):
    """更新API模式"""
    summary: Optional[str] = Field(None, description="API简介")
    description: Optional[str] = Field(None, description="API详细描述")
    tags: Optional[List[str]] = Field(None, description="API标签列表")
    is_available: Optional[bool] = Field(None, description="是否可用")
    parsed_request_params: Optional[List[APIParam]] = Field(None, description="请求参数列表")
    parsed_response_params: Optional[List[APIParam]] = Field(None, description="响应参数列表")


class APIResponse(APIBase):
    """API响应模式"""
    id: int = Field(..., description="API ID")
    document_id: int = Field(..., description="所属文档ID")
    tags: Optional[List[str]] = Field(None, description="API标签列表")
    is_available: bool = Field(True, description="是否可用")
    availability_reason: Optional[str] = Field(None, description="不可用原因")
    parsed_request_params: Optional[List[Dict[str, Any]]] = Field(None, description="请求参数列表")
    parsed_response_params: Optional[List[Dict[str, Any]]] = Field(None, description="响应参数列表")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")
    
    class Config:
        from_attributes = True


class APIDetailResponse(APIResponse):
    """API详情响应模式（包含完整Schema）"""
    request_schema: Optional[str] = Field(None, description="请求JSON Schema")
    response_schema: Optional[str] = Field(None, description="响应JSON Schema")


# ==================== 标签API查询 ====================

class TaggedAPIQuery(BaseModel):
    """按标签查询API"""
    tags: List[str] = Field(..., description="要查询的标签列表", example=["token"])
    group_id: Optional[int] = Field(None, description="限制分组ID")


# ==================== 分组数据集 ====================

class GroupDataSetBase(BaseModel):
    """分组数据集基础模式"""
    name: str = Field(..., description="数据集名称", example="用户测试数据")
    description: Optional[str] = Field(None, description="数据集描述")
    data: Optional[Dict[str, Any]] = Field(None, description="数据集内容（JSON对象）")


class GroupDataSetCreate(GroupDataSetBase):
    """创建分组数据集模式"""
    pass


class GroupDataSetUpdate(BaseModel):
    """更新分组数据集模式"""
    name: Optional[str] = Field(None, description="数据集名称")
    description: Optional[str] = Field(None, description="数据集描述")
    data: Optional[Dict[str, Any]] = Field(None, description="数据集内容")


class GroupDataSetResponse(GroupDataSetBase):
    """分组数据集响应模式"""
    id: int = Field(..., description="数据集ID")
    group_id: int = Field(..., description="所属分组ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")
    
    class Config:
        from_attributes = True


# ==================== 手动添加接口 ====================

class ManualAPICreate(BaseModel):
    """手动添加接口模式"""
    method: str = Field(..., description="HTTP方法", example="POST")
    path: str = Field(..., description="API路径", example="/api/users")
    summary: Optional[str] = Field(None, description="接口摘要")
    description: Optional[str] = Field(None, description="接口描述")
    tags: Optional[List[str]] = Field(None, description="接口标签")
    parsed_request_params: Optional[List[APIParam]] = Field(None, description="请求参数列表")
    parsed_response_params: Optional[List[APIParam]] = Field(None, description="响应参数列表")
    headers: Optional[Dict[str, str]] = Field(None, description="请求头配置")

