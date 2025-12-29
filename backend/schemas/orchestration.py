"""
可视化编排相关的Pydantic模式
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List


class FlowNode(BaseModel):
    """流程节点"""
    id: str
    type: str = "api"  # api, start, end等
    api_id: Optional[int] = None
    position: Dict[str, float]  # {x: number, y: number}
    data: Dict[str, Any] = {}  # 节点数据


class FlowEdge(BaseModel):
    """流程连线"""
    id: str
    source: str  # 源节点ID
    target: str  # 目标节点ID
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    type: Optional[str] = None
    data: Dict[str, Any] = {}  # 连线数据（字段映射等）


class FlowData(BaseModel):
    """编排流程数据"""
    nodes: List[FlowNode]
    edges: List[FlowEdge]
    viewport: Optional[Dict[str, Any]] = None  # 画布视口信息


class FieldMappingBase(BaseModel):
    """字段映射基础模式"""
    source_node_id: str
    target_node_id: str
    source_field_path: str
    target_field_path: str
    mapping_type: str = "request_param"


class FieldMappingCreate(FieldMappingBase):
    """创建字段映射模式"""
    pass


class FieldMappingResponse(FieldMappingBase):
    """字段映射响应模式"""
    id: int
    flow_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrchestrationFlowBase(BaseModel):
    """编排流程基础模式"""
    name: str
    description: Optional[str] = None
    flow_data: FlowData
    test_case_id: Optional[int] = None


class OrchestrationFlowCreate(OrchestrationFlowBase):
    """创建编排流程模式"""
    pass


class OrchestrationFlowUpdate(BaseModel):
    """更新编排流程模式"""
    name: Optional[str] = None
    description: Optional[str] = None
    flow_data: Optional[FlowData] = None
    test_case_id: Optional[int] = None


class OrchestrationFlowResponse(OrchestrationFlowBase):
    """编排流程响应模式"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


