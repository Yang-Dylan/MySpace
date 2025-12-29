"""
用户相关的Pydantic模式
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """用户基础模式"""
    username: str
    email: EmailStr


class UserCreate(UserBase):
    """创建用户模式"""
    password: str


class UserUpdate(BaseModel):
    """更新用户模式"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    """用户响应模式"""
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token响应模式"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token数据模式"""
    username: Optional[str] = None

