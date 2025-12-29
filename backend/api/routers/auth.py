"""
认证相关路由
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_password, create_access_token
from core.config import settings
from models.user import User
from schemas.user import Token, UserCreate, UserResponse
from api.dependencies import get_current_active_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="用户注册",
    description="注册新用户账号",
    responses={
        201: {"description": "注册成功"},
        400: {"description": "用户名或邮箱已存在"},
    }
)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    用户注册
    
    - **username**: 用户名（唯一，3-50个字符）
    - **email**: 邮箱地址（唯一，有效邮箱格式）
    - **password**: 密码（至少6个字符）
    """
    # 检查用户名是否已存在
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # 检查邮箱是否已存在
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 创建新用户
    from core.security import get_password_hash
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post(
    "/login",
    response_model=Token,
    summary="用户登录",
    description="使用用户名和密码登录，获取JWT访问令牌",
    responses={
        200: {"description": "登录成功，返回访问令牌"},
        401: {"description": "用户名或密码错误"},
        400: {"description": "用户账号未激活"},
    }
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    用户登录
    
    使用用户名和密码登录，成功后返回JWT访问令牌。
    
    返回的token需要在后续请求的Header中添加：
    ```
    Authorization: Bearer <access_token>
    ```
    
    Token默认有效期为30分钟（可在配置中修改）。
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="获取当前用户信息",
    description="获取当前登录用户的详细信息",
    responses={
        200: {"description": "获取成功"},
        401: {"description": "未认证或token无效"},
    }
)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    获取当前用户信息
    
    需要JWT认证。返回当前登录用户的详细信息，包括用户名、邮箱、权限等。
    """
    return current_user

