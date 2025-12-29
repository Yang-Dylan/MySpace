"""
测试执行相关的Pydantic模式
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class TestExecutionBase(BaseModel):
    """测试执行基础模式"""
    test_case_id: int
    thread_count: int = 1


class TestExecutionCreate(TestExecutionBase):
    """创建测试执行模式"""
    data_set_id: Optional[int] = None  # 可选的数据集ID


class TestExecutionResponse(TestExecutionBase):
    """测试执行响应模式"""
    id: int
    user_id: int
    status: str
    total_requests: int
    success_count: int
    failure_count: int
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    duration: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


class TestExecutionResultResponse(BaseModel):
    """测试执行结果响应模式"""
    id: int
    execution_id: int
    api_id: int
    order: int
    status: str
    status_code: Optional[int]
    request_url: Optional[str]
    request_method: Optional[str]
    response_time: Optional[float]
    error_message: Optional[str]
    retry_count: int
    executed_at: datetime
    
    class Config:
        from_attributes = True


class TestExecutionDetailResponse(TestExecutionResponse):
    """测试执行详情响应模式（包含结果列表）"""
    results: List[TestExecutionResultResponse] = []
    
    class Config:
        from_attributes = True


class TestDataSetBase(BaseModel):
    """测试数据集基础模式"""
    name: str
    description: Optional[str] = None
    data: List[Dict[str, Any]]  # 数据集内容


class TestDataSetCreate(TestDataSetBase):
    """创建测试数据集模式"""
    pass


class TestDataSetResponse(TestDataSetBase):
    """测试数据集响应模式"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

