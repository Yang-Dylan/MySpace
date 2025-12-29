"""
API配置管理路由
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from api.dependencies import get_current_active_user
from models.user import User
from models.api_config import APIConfig
from models.api_doc import API
from schemas.api_config import (
    APIConfigCreate, APIConfigUpdate, APIConfigResponse, DependencyOrderResult
)
from services.dependency_resolver import DependencyResolver

router = APIRouter(prefix="/api/api-configs", tags=["api-configs"])


@router.post(
    "/",
    response_model=APIConfigResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建API配置",
    description="为API创建配置（重试、等待时间、依赖关系等）"
)
async def create_api_config(
    config_data: APIConfigCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    创建API配置
    
    可以为特定API或创建全局配置模板。
    """
    # 如果指定了API ID，验证API是否存在
    if config_data.api_id:
        api = db.query(API).filter(API.id == config_data.api_id).first()
        if not api:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"API with id {config_data.api_id} not found"
            )
    
    # 验证依赖的API是否存在
    if config_data.depends_on:
        for dep_api_id in config_data.depends_on:
            dep_api = db.query(API).filter(API.id == dep_api_id).first()
            if not dep_api:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Dependency API with id {dep_api_id} not found"
                )
    
    db_config = APIConfig(
        name=config_data.name,
        api_id=config_data.api_id,
        user_id=current_user.id,
        retry_count=config_data.retry_count,
        retry_interval=config_data.retry_interval,
        retry_on_status=config_data.retry_on_status,
        wait_time=config_data.wait_time,
        wait_before=config_data.wait_before,
        depends_on=config_data.depends_on,
        field_mappings=config_data.field_mappings,
        timeout=config_data.timeout,
        headers=config_data.headers,
        is_active=True
    )
    
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    
    return db_config


@router.get(
    "/",
    response_model=List[APIConfigResponse],
    summary="获取API配置列表",
    description="获取当前用户的所有API配置"
)
async def list_api_configs(
    api_id: int = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取API配置列表"""
    query = db.query(APIConfig).filter(APIConfig.user_id == current_user.id)
    
    if api_id:
        query = query.filter(APIConfig.api_id == api_id)
    
    configs = query.all()
    return configs


@router.get(
    "/{config_id}",
    response_model=APIConfigResponse,
    summary="获取API配置详情",
    description="获取指定API配置的详细信息"
)
async def get_api_config(
    config_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取API配置详情"""
    config = db.query(APIConfig).filter(
        APIConfig.id == config_id,
        APIConfig.user_id == current_user.id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API config not found"
        )
    
    return config


@router.put(
    "/{config_id}",
    response_model=APIConfigResponse,
    summary="更新API配置",
    description="更新API配置信息"
)
async def update_api_config(
    config_id: int,
    config_update: APIConfigUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新API配置"""
    config = db.query(APIConfig).filter(
        APIConfig.id == config_id,
        APIConfig.user_id == current_user.id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API config not found"
        )
    
    # 验证依赖的API是否存在
    if config_update.depends_on is not None:
        for dep_api_id in config_update.depends_on:
            dep_api = db.query(API).filter(API.id == dep_api_id).first()
            if not dep_api:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Dependency API with id {dep_api_id} not found"
                )
    
    update_data = config_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    return config


@router.delete(
    "/{config_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除API配置",
    description="删除指定的API配置"
)
async def delete_api_config(
    config_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除API配置"""
    config = db.query(APIConfig).filter(
        APIConfig.id == config_id,
        APIConfig.user_id == current_user.id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API config not found"
        )
    
    db.delete(config)
    db.commit()
    return None


@router.post(
    "/resolve-dependencies",
    response_model=DependencyOrderResult,
    summary="解析依赖关系",
    description="根据API配置解析执行顺序，检测循环依赖"
)
async def resolve_dependencies(
    api_configs: List[dict],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    解析API依赖关系并确定执行顺序
    
    输入API配置列表，返回拓扑排序后的执行顺序。
    如果存在循环依赖，会返回错误信息。
    """
    resolver = DependencyResolver()
    result = resolver.resolve_execution_order(api_configs)
    
    return result

