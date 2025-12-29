"""
API配置模型

注意：本项目不使用数据库外键约束，所有relationship使用primaryjoin明确指定关联条件
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class APIConfig(Base):
    """API配置表（全局配置或模板）"""
    __tablename__ = "api_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # 配置名称
    api_id = Column(Integer, nullable=True, index=True)  # 关联的API（可选，None表示全局模板）
    user_id = Column(Integer, nullable=False, index=True)
    
    # 重试配置
    retry_count = Column(Integer, default=0)  # 重试次数
    retry_interval = Column(Integer, default=0)  # 重试间隔（秒）
    retry_on_status = Column(JSON)  # 触发重试的HTTP状态码列表，如[500, 502, 503]
    
    # 等待时间配置
    wait_time = Column(Integer, default=0)  # 等待时间（秒）
    wait_before = Column(Boolean, default=True)  # 是否在API调用前等待
    
    # 依赖关系配置
    depends_on = Column(JSON)  # 依赖的API ID列表
    field_mappings = Column(JSON)  # 字段映射：从依赖API提取字段并传递给当前API
    
    # 其他配置
    timeout = Column(Integer, default=30)  # 请求超时时间（秒）
    headers = Column(JSON)  # 自定义请求头
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    api = relationship(
        "API",
        primaryjoin="foreign(APIConfig.api_id) == API.id",
        backref="api_configs"
    )

