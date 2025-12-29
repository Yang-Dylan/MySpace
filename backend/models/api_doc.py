"""
API文档模型

注意：本项目不使用数据库外键约束，所有relationship使用primaryjoin明确指定关联条件
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class APIGroup(Base):
    """API分组表"""
    __tablename__ = "api_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    user_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    documents = relationship(
        "APIDocument", 
        primaryjoin="APIGroup.id == foreign(APIDocument.group_id)",
        back_populates="group"
    )
    datasets = relationship(
        "GroupDataSet",
        primaryjoin="APIGroup.id == foreign(GroupDataSet.group_id)",
        back_populates="group"
    )


class APIDocument(Base):
    """API文档表"""
    __tablename__ = "api_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    file_path = Column(String(500))  # 存储文件路径
    format = Column(String(50))  # OpenAPI, Swagger等
    content = Column(Text)  # 文档内容（JSON/YAML）
    user_id = Column(Integer, nullable=False, index=True)
    group_id = Column(Integer, nullable=True, index=True)  # 关联的API分组ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    apis = relationship(
        "API", 
        primaryjoin="APIDocument.id == foreign(API.document_id)",
        back_populates="document"
    )
    group = relationship(
        "APIGroup", 
        primaryjoin="foreign(APIDocument.group_id) == APIGroup.id",
        back_populates="documents"
    )


class GroupDataSet(Base):
    """分组数据集表"""
    __tablename__ = "group_data_sets"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    data = Column(JSON)  # 数据集内容
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    group = relationship(
        "APIGroup", 
        primaryjoin="foreign(GroupDataSet.group_id) == APIGroup.id",
        back_populates="datasets"
    )


class API(Base):
    """API表（从文档中解析出的API）"""
    __tablename__ = "apis"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, nullable=False, index=True)
    method = Column(String(10), nullable=False)  # GET, POST, PUT, DELETE等
    path = Column(String(500), nullable=False)
    summary = Column(String(255))
    description = Column(Text)
    request_schema = Column(Text)  # JSON Schema
    response_schema = Column(Text)  # JSON Schema
    # 新增字段
    tags = Column(JSON)  # API标签列表，如["token", "auth"]
    is_available = Column(Boolean, default=True)  # 是否可用
    availability_reason = Column(Text)  # 不可用原因
    parsed_request_params = Column(JSON)  # 解析后的请求参数列表
    parsed_response_params = Column(JSON)  # 解析后的响应参数列表
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    document = relationship(
        "APIDocument", 
        primaryjoin="foreign(API.document_id) == APIDocument.id",
        back_populates="apis"
    )

