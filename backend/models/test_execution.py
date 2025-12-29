"""
测试执行模型

注意：本项目不使用数据库外键约束，所有relationship使用primaryjoin明确指定关联条件
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class TestExecution(Base):
    """测试执行记录表"""
    __tablename__ = "test_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    test_case_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    status = Column(String(20), default="pending")  # pending, running, completed, failed, cancelled
    thread_count = Column(Integer, default=1)  # 使用的线程数
    total_requests = Column(Integer, default=0)  # 总请求数
    success_count = Column(Integer, default=0)  # 成功数
    failure_count = Column(Integer, default=0)  # 失败数
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    duration = Column(Float)  # 执行时长（秒）
    error_message = Column(Text)  # 错误信息
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    test_case = relationship(
        "TestCase", 
        primaryjoin="foreign(TestExecution.test_case_id) == TestCase.id",
        backref="executions"
    )
    results = relationship(
        "TestExecutionResult", 
        primaryjoin="TestExecution.id == foreign(TestExecutionResult.execution_id)",
        back_populates="execution"
    )


class TestExecutionResult(Base):
    """测试执行结果表"""
    __tablename__ = "test_execution_results"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, nullable=False, index=True)
    api_id = Column(Integer, nullable=False, index=True)
    order = Column(Integer)  # 执行顺序
    status = Column(String(20))  # success, failure, skipped
    status_code = Column(Integer)  # HTTP状态码
    request_url = Column(String(1000))  # 请求URL
    request_method = Column(String(10))  # 请求方法
    request_headers = Column(JSON)  # 请求头
    request_body = Column(Text)  # 请求体
    response_headers = Column(JSON)  # 响应头
    response_body = Column(Text)  # 响应体
    response_time = Column(Float)  # 响应时间（毫秒）
    error_message = Column(Text)  # 错误信息
    retry_count = Column(Integer, default=0)  # 重试次数
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    execution = relationship(
        "TestExecution", 
        primaryjoin="foreign(TestExecutionResult.execution_id) == TestExecution.id",
        back_populates="results"
    )
    api = relationship(
        "API",
        primaryjoin="foreign(TestExecutionResult.api_id) == API.id",
        backref="execution_results"
    )


class TestDataSet(Base):
    """测试数据集表"""
    __tablename__ = "test_data_sets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    user_id = Column(Integer, nullable=False, index=True)
    data = Column(JSON)  # 数据集内容（JSON数组，每个元素是一条测试数据）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

