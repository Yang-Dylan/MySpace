"""
可视化编排模型

注意：本项目不使用数据库外键约束，所有relationship使用primaryjoin明确指定关联条件
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class OrchestrationFlow(Base):
    """编排流程表"""
    __tablename__ = "orchestration_flows"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    user_id = Column(Integer, nullable=False, index=True)
    # 编排流程数据（JSON格式）
    # 包含：nodes（节点信息，包括位置、API ID等）、edges（连线信息，包括字段映射等）
    flow_data = Column(JSON, nullable=False)  # 存储完整的编排流程数据
    # 关联的测试用例ID（可选，编排流程可以独立存在，也可以关联到测试用例）
    test_case_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    test_case = relationship(
        "TestCase",
        primaryjoin="foreign(OrchestrationFlow.test_case_id) == TestCase.id",
        backref="orchestration_flows"
    )


class FieldMapping(Base):
    """字段映射表（用于存储API之间的字段关联关系）"""
    __tablename__ = "field_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    flow_id = Column(Integer, nullable=False, index=True)
    # 源API节点ID（在flow_data中的节点ID）
    source_node_id = Column(String(100), nullable=False)
    # 目标API节点ID
    target_node_id = Column(String(100), nullable=False)
    # 源字段路径（JSON路径，如 "data.user.id"）
    source_field_path = Column(String(500), nullable=False)
    # 目标字段路径（JSON路径）
    target_field_path = Column(String(500), nullable=False)
    # 映射类型（request_param, request_header, request_body等）
    mapping_type = Column(String(50), default="request_param")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    flow = relationship(
        "OrchestrationFlow",
        primaryjoin="foreign(FieldMapping.flow_id) == OrchestrationFlow.id",
        backref="field_mappings"
    )


