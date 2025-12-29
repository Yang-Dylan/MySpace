"""
测试用例模型

注意：本项目不使用数据库外键约束，所有relationship使用primaryjoin明确指定关联条件
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class TestCase(Base):
    """测试用例表"""
    __tablename__ = "test_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    user_id = Column(Integer, nullable=False, index=True)
    # 测试用例配置（JSON格式存储）
    config = Column(JSON)  # 包含API列表、执行顺序、字段映射等
    is_active = Column(Boolean, default=True)
    # 数据集关联
    data_set_id = Column(Integer, nullable=True, index=True)  # 关联的数据集ID
    data_set_field_mappings = Column(JSON)  # 数据集字段映射配置
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    permissions = relationship(
        "TestCasePermission", 
        primaryjoin="TestCase.id == foreign(TestCasePermission.test_case_id)",
        back_populates="test_case"
    )


class TestCaseAPI(Base):
    """测试用例中的API配置表"""
    __tablename__ = "test_case_apis"
    
    id = Column(Integer, primary_key=True, index=True)
    test_case_id = Column(Integer, nullable=False, index=True)
    api_id = Column(Integer, nullable=False, index=True)
    order = Column(Integer, default=0)  # 执行顺序
    # API配置（重试、等待时间等）
    retry_count = Column(Integer, default=0)  # 重试次数
    retry_interval = Column(Integer, default=0)  # 重试间隔（秒）
    wait_time = Column(Integer, default=0)  # 等待时间（秒）
    # 字段映射配置（JSON格式）
    field_mappings = Column(JSON)  # 从其他API提取字段并映射到当前API（旧格式，保持兼容）
    enhanced_field_mappings = Column(JSON)  # 增强的字段映射配置（新格式）
    # 请求参数（JSON格式）
    request_params = Column(JSON)  # API请求参数
    # 条件执行配置（JSON格式）
    execution_condition = Column(JSON)  # 条件执行配置，包含conditions, logic, on_fail等
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    test_case = relationship(
        "TestCase", 
        primaryjoin="foreign(TestCaseAPI.test_case_id) == TestCase.id",
        backref="test_case_apis"
    )
    api = relationship(
        "API",
        primaryjoin="foreign(TestCaseAPI.api_id) == API.id"
    )

