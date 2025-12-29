"""
数据库管理路由
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from core.database import get_db
from api.dependencies import get_current_active_user
from models.user import User
from models.database_management import SQLFile, DatabaseOperation
from schemas.database_management import (
    SQLFileCreate, SQLFileUpdate, SQLFileResponse,
    DatabaseOperationCreate, DatabaseOperationResponse
)
from services.sql_validator import SQLValidator
from services.database_executor import DatabaseExecutor

router = APIRouter(prefix="/api/database", tags=["database"])


@router.post(
    "/sql-files/upload",
    response_model=SQLFileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="上传SQL文件",
    description="上传SQL文件用于数据库初始化和清理"
)
async def upload_sql_file(
    file: UploadFile = File(...),
    file_type: str = "init",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    上传SQL文件
    
    支持上传用于数据库初始化或清理的SQL文件。
    文件会自动进行验证。
    """
    if file_type not in ["init", "cleanup"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file_type must be 'init' or 'cleanup'"
        )
    
    # 读取文件内容
    content = await file.read()
    content_str = content.decode("utf-8")
    
    # 验证SQL
    validator = SQLValidator()
    is_valid, error_message = validator.validate_sql(content_str, file_type)
    
    # 创建SQL文件记录
    db_file = SQLFile(
        name=file.filename or "untitled.sql",
        content=content_str,
        file_type=file_type,
        user_id=current_user.id,
        is_validated=is_valid,
        validation_error=error_message if not is_valid else None
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return db_file


@router.get(
    "/sql-files/",
    response_model=List[SQLFileResponse],
    summary="获取SQL文件列表",
    description="获取当前用户的所有SQL文件"
)
async def list_sql_files(
    file_type: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取SQL文件列表"""
    query = db.query(SQLFile).filter(SQLFile.user_id == current_user.id)
    
    if file_type:
        query = query.filter(SQLFile.file_type == file_type)
    
    files = query.all()
    return files


@router.get(
    "/sql-files/{file_id}",
    response_model=SQLFileResponse,
    summary="获取SQL文件详情",
    description="获取指定SQL文件的详细信息"
)
async def get_sql_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取SQL文件详情"""
    sql_file = db.query(SQLFile).filter(
        SQLFile.id == file_id,
        SQLFile.user_id == current_user.id
    ).first()
    
    if not sql_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SQL file not found"
        )
    
    return sql_file


@router.put(
    "/sql-files/{file_id}",
    response_model=SQLFileResponse,
    summary="更新SQL文件",
    description="更新SQL文件内容，会重新验证"
)
async def update_sql_file(
    file_id: int,
    file_update: SQLFileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新SQL文件"""
    sql_file = db.query(SQLFile).filter(
        SQLFile.id == file_id,
        SQLFile.user_id == current_user.id
    ).first()
    
    if not sql_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SQL file not found"
        )
    
    update_data = file_update.dict(exclude_unset=True)
    
    # 如果更新了内容，重新验证
    if "content" in update_data:
        validator = SQLValidator()
        file_type = update_data.get("file_type", sql_file.file_type)
        is_valid, error_message = validator.validate_sql(update_data["content"], file_type)
        update_data["is_validated"] = is_valid
        update_data["validation_error"] = error_message if not is_valid else None
    
    for field, value in update_data.items():
        setattr(sql_file, field, value)
    
    db.commit()
    db.refresh(sql_file)
    return sql_file


@router.delete(
    "/sql-files/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除SQL文件",
    description="删除指定的SQL文件"
)
async def delete_sql_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除SQL文件"""
    sql_file = db.query(SQLFile).filter(
        SQLFile.id == file_id,
        SQLFile.user_id == current_user.id
    ).first()
    
    if not sql_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SQL file not found"
        )
    
    db.delete(sql_file)
    db.commit()
    return None


@router.post(
    "/sql-files/{file_id}/validate",
    summary="验证SQL文件",
    description="验证SQL文件的有效性和安全性"
)
async def validate_sql_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """验证SQL文件"""
    sql_file = db.query(SQLFile).filter(
        SQLFile.id == file_id,
        SQLFile.user_id == current_user.id
    ).first()
    
    if not sql_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SQL file not found"
        )
    
    validator = SQLValidator()
    is_valid, error_message = validator.validate_sql(sql_file.content, sql_file.file_type)
    dangerous_ops = validator.check_dangerous_operations(sql_file.content)
    
    # 更新验证状态
    sql_file.is_validated = is_valid
    sql_file.validation_error = error_message if not is_valid else None
    db.commit()
    
    return {
        "valid": is_valid,
        "error": error_message,
        "dangerous_operations": dangerous_ops
    }


@router.post(
    "/sql-files/{file_id}/execute",
    response_model=DatabaseOperationResponse,
    summary="执行SQL文件",
    description="执行SQL文件进行数据库初始化或清理"
)
async def execute_sql_file(
    file_id: int,
    operation_data: DatabaseOperationCreate,
    require_confirmation: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    执行SQL文件
    
    对于清理操作，建议设置 require_confirmation=True 以确保安全。
    """
    sql_file = db.query(SQLFile).filter(
        SQLFile.id == file_id,
        SQLFile.user_id == current_user.id
    ).first()
    
    if not sql_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SQL file not found"
        )
    
    # 检查文件类型和操作类型是否匹配
    if sql_file.file_type == "cleanup" and operation_data.operation_type != "cleanup":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="清理类型的SQL文件只能用于清理操作"
        )
    
    # 执行SQL
    executor = DatabaseExecutor(db)
    operation = executor.execute_sql_file(
        sql_file,
        operation_data.operation_type,
        operation_data.target_database,
        require_confirmation or (sql_file.file_type == "cleanup")
    )
    
    return operation


@router.get(
    "/operations/",
    response_model=List[DatabaseOperationResponse],
    summary="获取数据库操作记录",
    description="获取数据库操作的执行历史"
)
async def list_database_operations(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取数据库操作记录"""
    operations = db.query(DatabaseOperation).filter(
        DatabaseOperation.user_id == current_user.id
    ).order_by(DatabaseOperation.created_at.desc()).offset(skip).limit(limit).all()
    return operations


@router.get(
    "/operations/{operation_id}",
    response_model=DatabaseOperationResponse,
    summary="获取数据库操作详情",
    description="获取指定数据库操作的详细信息"
)
async def get_database_operation(
    operation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取数据库操作详情"""
    operation = db.query(DatabaseOperation).filter(
        DatabaseOperation.id == operation_id,
        DatabaseOperation.user_id == current_user.id
    ).first()
    
    if not operation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database operation not found"
        )
    
    return operation


