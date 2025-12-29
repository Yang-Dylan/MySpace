"""
数据库管理相关的Pydantic模式
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SQLFileBase(BaseModel):
    """SQL文件基础模式"""
    name: str
    description: Optional[str] = None
    content: str
    file_type: str = "init"  # init: 初始化, cleanup: 清理


class SQLFileCreate(SQLFileBase):
    """创建SQL文件模式"""
    pass


class SQLFileUpdate(BaseModel):
    """更新SQL文件模式"""
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    file_type: Optional[str] = None


class SQLFileResponse(SQLFileBase):
    """SQL文件响应模式"""
    id: int
    user_id: int
    is_validated: bool
    validation_error: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class DatabaseOperationBase(BaseModel):
    """数据库操作基础模式"""
    sql_file_id: int
    operation_type: str
    target_database: Optional[str] = None


class DatabaseOperationCreate(DatabaseOperationBase):
    """创建数据库操作模式"""
    pass


class DatabaseOperationResponse(DatabaseOperationBase):
    """数据库操作响应模式"""
    id: int
    user_id: int
    status: str
    executed_sql: Optional[str] = None
    result: Optional[str] = None
    error_message: Optional[str] = None
    affected_rows: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


