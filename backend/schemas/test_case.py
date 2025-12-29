"""
测试用例相关的Pydantic模式
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal


class FieldMappingItem(BaseModel):
    """字段映射项"""
    source_field: str = Field(..., description="源字段路径，如 data.user.id")
    target_field: str = Field(..., description="目标字段路径，如 body.userId")
    source_type: str = Field(default="api", description="源类型：api（来自其他API响应）或 data_set（来自数据集）")
    source_api_id: Optional[int] = Field(default=None, description="当source_type为api时，指定源API ID")


class ExecutionConditionItem(BaseModel):
    """条件执行项 - 单个条件"""
    source_api_id: int = Field(..., description="源API ID，用于获取响应数据")
    field_path: str = Field(..., description="响应字段路径，如 data.status")
    operator: Literal[
        "equals", "not_equals", 
        "contains", "not_contains",
        "gt", "gte", "lt", "lte",
        "exists", "not_exists",
        "is_empty", "not_empty"
    ] = Field(..., description="运算符")
    value: Optional[Any] = Field(default=None, description="期望值（部分运算符如exists不需要此字段）")


class ExecutionCondition(BaseModel):
    """条件执行配置"""
    enabled: bool = Field(default=False, description="是否启用条件执行")
    conditions: List[ExecutionConditionItem] = Field(default=[], description="条件列表")
    logic: Literal["AND", "OR"] = Field(default="AND", description="条件组合逻辑")
    on_fail: Literal["skip", "fail", "continue"] = Field(
        default="skip", 
        description="条件不满足时的处理策略：skip-跳过, fail-标记失败, continue-继续执行"
    )


class TestCaseAPIBase(BaseModel):
    """测试用例API基础模式"""
    api_id: int = Field(..., description="API ID")
    order: int = Field(default=0, description="执行顺序")
    retry_count: int = Field(default=0, description="重试次数")
    retry_interval: int = Field(default=0, description="重试间隔（秒）")
    wait_time: int = Field(default=0, description="等待时间（秒）")
    field_mappings: Optional[Dict[str, Any]] = Field(default=None, description="字段映射配置（旧格式，保持兼容）")
    request_params: Optional[Dict[str, Any]] = Field(default=None, description="API请求参数")
    # 增强的字段映射配置
    enhanced_field_mappings: Optional[List[FieldMappingItem]] = Field(default=None, description="增强的字段映射配置")
    # 条件执行配置
    execution_condition: Optional[ExecutionCondition] = Field(default=None, description="条件执行配置")


class TestCaseAPIResponse(TestCaseAPIBase):
    """测试用例API响应模式"""
    id: int = Field(..., description="记录ID")
    test_case_id: int = Field(..., description="测试用例ID")
    created_at: datetime = Field(..., description="创建时间")
    
    class Config:
        from_attributes = True


class TestCaseBase(BaseModel):
    """测试用例基础模式"""
    name: str
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class TestCaseCreate(TestCaseBase):
    """创建测试用例模式"""
    apis: List[TestCaseAPIBase] = []
    data_set_id: Optional[int] = None  # 关联的数据集ID
    data_set_field_mappings: Optional[List[FieldMappingItem]] = None  # 数据集字段映射


class TestCaseUpdate(BaseModel):
    """更新测试用例模式"""
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    apis: Optional[List[TestCaseAPIBase]] = None
    is_active: Optional[bool] = None
    data_set_id: Optional[int] = None  # 关联的数据集ID
    data_set_field_mappings: Optional[List[FieldMappingItem]] = None  # 数据集字段映射


class TestCaseResponse(TestCaseBase):
    """测试用例响应模式"""
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    data_set_id: Optional[int] = None  # 关联的数据集ID
    
    class Config:
        from_attributes = True


class TestCaseDetailResponse(TestCaseResponse):
    """测试用例详情响应模式（包含API列表）"""
    apis: List[TestCaseAPIResponse] = []
    data_set_field_mappings: Optional[List[FieldMappingItem]] = None  # 数据集字段映射
    
    class Config:
        from_attributes = True

