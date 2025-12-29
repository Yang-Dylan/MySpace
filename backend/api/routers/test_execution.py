"""
测试执行路由
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from core.database import get_db
from api.dependencies import get_current_active_user
from models.user import User
from models.test_case import TestCase
from models.test_execution import TestExecution, TestExecutionResult
from models.test_execution import TestDataSet
from schemas.test_execution import (
    TestExecutionCreate, TestExecutionResponse, TestExecutionDetailResponse,
    TestExecutionResultResponse, TestDataSetCreate, TestDataSetResponse
)
from services.test_executor import TestExecutor

router = APIRouter(prefix="/api/test-executions", tags=["test-executions"])


async def run_test_execution(
    test_case_id: int,
    user_id: int,
    thread_count: int,
    data_set: Optional[List[dict]],
    execution_id: int,
    db: Session
):
    """后台执行测试任务"""
    test_case = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if not test_case:
        return
    
    executor = TestExecutor(db)
    try:
        await executor.execute_test_case(test_case, thread_count, data_set, execution_id)
    finally:
        await executor.close()


@router.post(
    "/",
    response_model=TestExecutionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建测试执行",
    description="创建并启动测试执行任务"
)
async def create_test_execution(
    execution_data: TestExecutionCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    创建测试执行
    
    测试执行会在后台异步运行。
    """
    # 验证测试用例是否存在
    test_case = db.query(TestCase).filter(
        TestCase.id == execution_data.test_case_id,
        TestCase.user_id == current_user.id
    ).first()
    
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    # 获取数据集（如果指定）
    data_set = None
    if execution_data.data_set_id:
        data_set_obj = db.query(TestDataSet).filter(
            TestDataSet.id == execution_data.data_set_id,
            TestDataSet.user_id == current_user.id
        ).first()
        if data_set_obj:
            data_set = data_set_obj.data
    
    # 创建执行记录
    execution = TestExecution(
        test_case_id=execution_data.test_case_id,
        user_id=current_user.id,
        status="pending",
        thread_count=execution_data.thread_count
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    # 在后台执行测试
    background_tasks.add_task(
        run_test_execution,
        execution_data.test_case_id,
        current_user.id,
        execution_data.thread_count,
        data_set,
        execution.id,
        db
    )
    
    return execution


@router.get(
    "/",
    response_model=List[TestExecutionResponse],
    summary="获取测试执行列表",
    description="获取当前用户的所有测试执行记录"
)
async def list_test_executions(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取测试执行列表"""
    executions = db.query(TestExecution).filter(
        TestExecution.user_id == current_user.id
    ).order_by(TestExecution.created_at.desc()).offset(skip).limit(limit).all()
    return executions


@router.get(
    "/{execution_id}",
    response_model=TestExecutionDetailResponse,
    summary="获取测试执行详情",
    description="获取测试执行的详细信息和结果"
)
async def get_test_execution(
    execution_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取测试执行详情"""
    execution = db.query(TestExecution).filter(
        TestExecution.id == execution_id,
        TestExecution.user_id == current_user.id
    ).first()
    
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test execution not found"
        )
    
    # 获取执行结果
    results = db.query(TestExecutionResult).filter(
        TestExecutionResult.execution_id == execution_id
    ).order_by(TestExecutionResult.order).all()
    
    # 构建响应
    response_data = TestExecutionResponse.from_orm(execution).dict()
    response_data["results"] = [TestExecutionResultResponse.from_orm(r).dict() for r in results]
    
    return response_data


@router.post(
    "/{execution_id}/cancel",
    summary="取消测试执行",
    description="取消正在运行的测试执行"
)
async def cancel_test_execution(
    execution_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """取消测试执行"""
    execution = db.query(TestExecution).filter(
        TestExecution.id == execution_id,
        TestExecution.user_id == current_user.id
    ).first()
    
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test execution not found"
        )
    
    if execution.status not in ["pending", "running"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Execution cannot be cancelled"
        )
    
    from datetime import datetime
    execution.status = "cancelled"
    execution.end_time = datetime.utcnow()
    db.commit()
    
    return {"message": "Execution cancelled"}

