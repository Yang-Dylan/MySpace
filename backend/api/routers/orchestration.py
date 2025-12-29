"""
可视化编排路由
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from api.dependencies import get_current_active_user
from models.user import User
from models.orchestration import OrchestrationFlow, FieldMapping
from schemas.orchestration import (
    OrchestrationFlowCreate, OrchestrationFlowUpdate, OrchestrationFlowResponse,
    FieldMappingCreate, FieldMappingResponse
)

router = APIRouter(prefix="/api/orchestration", tags=["orchestration"])


@router.post(
    "/flows",
    response_model=OrchestrationFlowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建编排流程",
    description="创建新的可视化编排流程"
)
async def create_orchestration_flow(
    flow_data: OrchestrationFlowCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """创建编排流程"""
    db_flow = OrchestrationFlow(
        name=flow_data.name,
        description=flow_data.description,
        user_id=current_user.id,
        flow_data=flow_data.flow_data.dict(),
        test_case_id=flow_data.test_case_id
    )
    
    db.add(db_flow)
    db.commit()
    db.refresh(db_flow)
    
    return db_flow


@router.get(
    "/flows",
    response_model=List[OrchestrationFlowResponse],
    summary="获取编排流程列表",
    description="获取当前用户的所有编排流程"
)
async def list_orchestration_flows(
    test_case_id: int = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取编排流程列表"""
    query = db.query(OrchestrationFlow).filter(OrchestrationFlow.user_id == current_user.id)
    
    if test_case_id:
        query = query.filter(OrchestrationFlow.test_case_id == test_case_id)
    
    flows = query.order_by(OrchestrationFlow.created_at.desc()).all()
    return flows


@router.get(
    "/flows/{flow_id}",
    response_model=OrchestrationFlowResponse,
    summary="获取编排流程详情",
    description="获取指定编排流程的详细信息"
)
async def get_orchestration_flow(
    flow_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取编排流程详情"""
    flow = db.query(OrchestrationFlow).filter(
        OrchestrationFlow.id == flow_id,
        OrchestrationFlow.user_id == current_user.id
    ).first()
    
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orchestration flow not found"
        )
    
    return flow


@router.put(
    "/flows/{flow_id}",
    response_model=OrchestrationFlowResponse,
    summary="更新编排流程",
    description="更新编排流程的信息和流程数据"
)
async def update_orchestration_flow(
    flow_id: int,
    flow_update: OrchestrationFlowUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新编排流程"""
    flow = db.query(OrchestrationFlow).filter(
        OrchestrationFlow.id == flow_id,
        OrchestrationFlow.user_id == current_user.id
    ).first()
    
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orchestration flow not found"
        )
    
    update_data = flow_update.dict(exclude_unset=True)
    
    # 如果更新了flow_data，需要转换为字典
    if "flow_data" in update_data and update_data["flow_data"]:
        update_data["flow_data"] = update_data["flow_data"].dict()
    
    for field, value in update_data.items():
        setattr(flow, field, value)
    
    db.commit()
    db.refresh(flow)
    return flow


@router.delete(
    "/flows/{flow_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除编排流程",
    description="删除指定的编排流程"
)
async def delete_orchestration_flow(
    flow_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除编排流程"""
    flow = db.query(OrchestrationFlow).filter(
        OrchestrationFlow.id == flow_id,
        OrchestrationFlow.user_id == current_user.id
    ).first()
    
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orchestration flow not found"
        )
    
    db.delete(flow)
    db.commit()
    return None


@router.post(
    "/flows/{flow_id}/apply-to-test-case",
    summary="将编排流程应用到测试用例",
    description="将编排流程中的API节点和字段映射应用到指定的测试用例"
)
async def apply_flow_to_test_case(
    flow_id: int,
    body: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    将编排流程应用到测试用例
    
    这个功能会将编排流程中的API节点转换为测试用例的API配置，
    包括执行顺序和字段映射关系。
    """
    from models.test_case import TestCase, TestCaseAPI
    
    test_case_id = body.get("test_case_id")
    if not test_case_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="test_case_id is required"
        )
    
    # 验证流程存在
    flow = db.query(OrchestrationFlow).filter(
        OrchestrationFlow.id == flow_id,
        OrchestrationFlow.user_id == current_user.id
    ).first()
    
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orchestration flow not found"
        )
    
    # 验证测试用例存在
    test_case = db.query(TestCase).filter(
        TestCase.id == test_case_id,
        TestCase.user_id == current_user.id
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    # 解析流程数据
    flow_data = flow.flow_data
    if not isinstance(flow_data, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid flow data format"
        )
    
    nodes = flow_data.get("nodes", [])
    edges = flow_data.get("edges", [])
    
    # 按节点顺序排序（根据edges确定执行顺序）
    node_order = {}
    order = 0
    for edge in edges:
        if edge.get("source") not in node_order:
            node_order[edge["source"]] = order
            order += 1
        if edge.get("target") not in node_order:
            node_order[edge["target"]] = order
            order += 1
    
    # 处理没有连线的节点
    for node in nodes:
        if node.get("id") not in node_order:
            node_order[node["id"]] = order
            order += 1
    
    # 删除现有的测试用例API配置
    db.query(TestCaseAPI).filter(TestCaseAPI.test_case_id == test_case_id).delete()
    
    # 创建新的测试用例API配置
    for node in nodes:
        if node.get("type") == "api" and node.get("api_id"):
            # 收集该节点的字段映射（从edges中）
            field_mappings = []
            for edge in edges:
                if edge.get("target") == node.get("id") and edge.get("data", {}).get("field_mapping"):
                    field_mappings.append(edge["data"]["field_mapping"])
            
            test_case_api = TestCaseAPI(
                test_case_id=test_case_id,
                api_id=node["api_id"],
                order=node_order.get(node["id"], 0),
                field_mappings=field_mappings if field_mappings else None
            )
            db.add(test_case_api)
    
    db.commit()
    
    return {"message": "编排流程已成功应用到测试用例", "test_case_id": test_case_id}


@router.get(
    "/flows/{flow_id}/field-mappings",
    response_model=List[FieldMappingResponse],
    summary="获取字段映射列表",
    description="获取编排流程中的所有字段映射"
)
async def list_field_mappings(
    flow_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取字段映射列表"""
    flow = db.query(OrchestrationFlow).filter(
        OrchestrationFlow.id == flow_id,
        OrchestrationFlow.user_id == current_user.id
    ).first()
    
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orchestration flow not found"
        )
    
    mappings = db.query(FieldMapping).filter(FieldMapping.flow_id == flow_id).all()
    return mappings


@router.post(
    "/flows/{flow_id}/field-mappings",
    response_model=FieldMappingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建字段映射",
    description="为编排流程创建字段映射关系"
)
async def create_field_mapping(
    flow_id: int,
    mapping_data: FieldMappingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """创建字段映射"""
    flow = db.query(OrchestrationFlow).filter(
        OrchestrationFlow.id == flow_id,
        OrchestrationFlow.user_id == current_user.id
    ).first()
    
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orchestration flow not found"
        )
    
    db_mapping = FieldMapping(
        flow_id=flow_id,
        **mapping_data.dict()
    )
    
    db.add(db_mapping)
    db.commit()
    db.refresh(db_mapping)
    
    return db_mapping

