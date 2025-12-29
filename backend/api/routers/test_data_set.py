"""
测试数据集路由
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from api.dependencies import get_current_active_user
from models.user import User
from models.test_execution import TestDataSet
from schemas.test_execution import TestDataSetCreate, TestDataSetResponse

router = APIRouter(prefix="/api/test-data-sets", tags=["test-data-sets"])


@router.post(
    "/",
    response_model=TestDataSetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建测试数据集",
    description="创建用于驱动测试的数据集"
)
async def create_test_data_set(
    data_set_data: TestDataSetCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """创建测试数据集"""
    db_data_set = TestDataSet(
        name=data_set_data.name,
        description=data_set_data.description,
        data=data_set_data.data,
        user_id=current_user.id
    )
    
    db.add(db_data_set)
    db.commit()
    db.refresh(db_data_set)
    
    return db_data_set


@router.get(
    "/",
    response_model=List[TestDataSetResponse],
    summary="获取测试数据集列表",
    description="获取当前用户的所有测试数据集"
)
async def list_test_data_sets(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取测试数据集列表"""
    data_sets = db.query(TestDataSet).filter(
        TestDataSet.user_id == current_user.id
    ).all()
    return data_sets


@router.get(
    "/{data_set_id}",
    response_model=TestDataSetResponse,
    summary="获取测试数据集详情",
    description="获取指定测试数据集的详细信息"
)
async def get_test_data_set(
    data_set_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取测试数据集详情"""
    data_set = db.query(TestDataSet).filter(
        TestDataSet.id == data_set_id,
        TestDataSet.user_id == current_user.id
    ).first()
    
    if not data_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test data set not found"
        )
    
    return data_set


@router.delete(
    "/{data_set_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除测试数据集",
    description="删除指定的测试数据集"
)
async def delete_test_data_set(
    data_set_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除测试数据集"""
    data_set = db.query(TestDataSet).filter(
        TestDataSet.id == data_set_id,
        TestDataSet.user_id == current_user.id
    ).first()
    
    if not data_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test data set not found"
        )
    
    db.delete(data_set)
    db.commit()
    return None


