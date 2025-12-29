"""
用户模型

注意：本项目不使用数据库外键约束，所有relationship使用primaryjoin明确指定关联条件
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    test_case_permissions = relationship(
        "TestCasePermission", 
        primaryjoin="User.id == foreign(TestCasePermission.user_id)",
        back_populates="user"
    )


class Role(Base):
    """角色表"""
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Permission(Base):
    """权限表"""
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    resource = Column(String(50), nullable=False)  # 资源类型：test_case, api_doc等
    action = Column(String(50), nullable=False)  # 操作：read, write, delete等


class TestCasePermission(Base):
    """测试用例权限表"""
    __tablename__ = "test_case_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    test_case_id = Column(Integer, nullable=False, index=True)
    can_read = Column(Boolean, default=True)
    can_write = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系 - 使用primaryjoin明确指定关联条件（不依赖外键）
    user = relationship(
        "User", 
        primaryjoin="foreign(TestCasePermission.user_id) == User.id",
        back_populates="test_case_permissions"
    )
    test_case = relationship(
        "TestCase", 
        primaryjoin="foreign(TestCasePermission.test_case_id) == TestCase.id",
        back_populates="permissions"
    )

