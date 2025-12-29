"""
API配置相关的Pydantic模式
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class APIConfigBase(BaseModel):
    """API配置基础模式"""
    name: str
    api_id: Optional[int] = None
    retry_count: int = 0
    retry_interval: int = 0
    retry_on_status: Optional[List[int]] = None
    wait_time: int = 0
    wait_before: bool = True
    depends_on: Optional[List[int]] = None
    field_mappings: Optional[Dict[str, Any]] = None
    timeout: int = 30
    headers: Optional[Dict[str, str]] = None


class APIConfigCreate(APIConfigBase):
    """创建API配置模式"""
    pass


class APIConfigUpdate(BaseModel):
    """更新API配置模式"""
    name: Optional[str] = None
    retry_count: Optional[int] = None
    retry_interval: Optional[int] = None
    retry_on_status: Optional[List[int]] = None
    wait_time: Optional[int] = None
    wait_before: Optional[bool] = None
    depends_on: Optional[List[int]] = None
    field_mappings: Optional[Dict[str, Any]] = None
    timeout: Optional[int] = None
    headers: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None


class APIConfigResponse(APIConfigBase):
    """API配置响应模式"""
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class DependencyOrderResult(BaseModel):
    """依赖关系排序结果"""
    ordered_apis: List[int]  # 排序后的API ID列表
    dependencies: Dict[int, List[int]]  # API依赖关系映射
    has_circular_dependency: bool  # 是否存在循环依赖
    circular_dependencies: Optional[List[List[int]]] = None  # 循环依赖路径

