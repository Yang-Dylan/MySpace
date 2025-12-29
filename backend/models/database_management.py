"""
数据库管理模型

注意：本项目不使用数据库外键约束，所有relationship使用primaryjoin明确指定关联条件
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class SQLFile(Base):
    """SQL文件表"""
    __tablename__ = "sql_files"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    content = Column(Text, nullable=False)  # SQL文件内容
    file_type = Column(String(20), default="init")  # init: 初始化, cleanup: 清理
    user_id = Column(Integer, nullable=False, index=True)
    is_validated = Column(Boolean, default=False)  # 是否已验证
    validation_error = Column(Text)  # 验证错误信息
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DatabaseOperation(Base):
    """数据库操作记录表"""
    __tablename__ = "database_operations"
    
    id = Column(Integer, primary_key=True, index=True)
    sql_file_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    operation_type = Column(String(20))  # init: 初始化, cleanup: 清理
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    target_database = Column(String(100))  # 目标数据库名称
    executed_sql = Column(Text)  # 实际执行的SQL
    result = Column(Text)  # 执行结果
    error_message = Column(Text)  # 错误信息
    affected_rows = Column(Integer)  # 影响的行数
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    sql_file = relationship(
        "SQLFile",
        primaryjoin="foreign(DatabaseOperation.sql_file_id) == SQLFile.id",
        backref="operations"
    )


