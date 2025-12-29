"""
API分组管理路由
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field

from core.database import get_db
from api.dependencies import get_current_active_user
from models.user import User
from models.api_doc import APIGroup, APIDocument, API
from models.test_case import TestCase, TestCaseAPI
from schemas.api_doc import (
    APIGroupCreate, APIGroupUpdate, APIGroupResponse, APIResponse,
    GroupDataSetCreate, GroupDataSetUpdate, GroupDataSetResponse,
    ManualAPICreate
)
from schemas.test_case import TestCaseResponse
from models.api_doc import GroupDataSet

router = APIRouter(prefix="/api/api-groups", tags=["api-groups"])


class APIGroupWithCount(APIGroupResponse):
    """带文档计数的API分组响应"""
    document_count: int = Field(0, description="分组内文档数量")
    api_count: int = Field(0, description="分组内API接口数量")
    test_case_count: int = Field(0, description="使用该分组API的用例数量")


@router.post(
    "/",
    response_model=APIGroupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建API分组",
    description="创建一个新的API分组，用于组织管理API文档"
)
async def create_api_group(
    group_data: APIGroupCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    创建API分组
    
    - **name**: 分组名称（必填）
    - **description**: 分组描述（可选）
    
    返回创建的分组信息。
    """
    # 检查名称是否重复
    existing = db.query(APIGroup).filter(
        APIGroup.name == group_data.name,
        APIGroup.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="分组名称已存在"
        )
    
    db_group = APIGroup(
        name=group_data.name,
        description=group_data.description,
        user_id=current_user.id
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    return db_group


def _get_group_stats(db: Session, group_id: int) -> dict:
    """获取分组的统计信息"""
    # 文档数量
    doc_count = db.query(APIDocument).filter(
        APIDocument.group_id == group_id
    ).count()
    
    # 获取分组下的所有文档ID
    doc_ids = db.query(APIDocument.id).filter(
        APIDocument.group_id == group_id
    ).all()
    doc_id_list = [d[0] for d in doc_ids]
    
    # API数量（通过文档ID列表）
    api_count = 0
    if doc_id_list:
        api_count = db.query(API).filter(
            API.document_id.in_(doc_id_list)
        ).count()
    
    # 使用该分组API的用例数量
    test_case_count = 0
    if doc_id_list:
        # 找出该分组下的所有API ID
        group_api_ids = db.query(API.id).filter(
            API.document_id.in_(doc_id_list)
        ).all()
        api_id_list = [a[0] for a in group_api_ids]
        
        if api_id_list:
            # 找出使用这些API的测试用例
            test_case_count = db.query(func.count(func.distinct(TestCaseAPI.test_case_id))).filter(
                TestCaseAPI.api_id.in_(api_id_list)
            ).scalar() or 0
    
    return {
        "document_count": doc_count,
        "api_count": api_count,
        "test_case_count": test_case_count
    }


@router.get(
    "/",
    response_model=List[APIGroupWithCount],
    summary="获取API分组列表",
    description="获取当前用户的所有API分组列表，包含每个分组的文档数量、接口数量和用例数量"
)
async def list_api_groups(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取API分组列表
    
    返回当前用户创建的所有API分组，包含每个分组下的：
    - 文档数量
    - API接口数量
    - 使用该分组API的测试用例数量
    """
    groups = db.query(APIGroup).filter(
        APIGroup.user_id == current_user.id
    ).all()
    
    result = []
    for group in groups:
        stats = _get_group_stats(db, group.id)
        
        result.append(APIGroupWithCount(
            id=group.id,
            name=group.name,
            description=group.description,
            user_id=group.user_id,
            created_at=group.created_at,
            updated_at=group.updated_at,
            **stats
        ))
    
    return result


@router.get(
    "/{group_id}",
    response_model=APIGroupWithCount,
    summary="获取API分组详情",
    description="获取指定API分组的详细信息，包含统计数据"
)
async def get_api_group(
    group_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取API分组详情
    
    - **group_id**: 分组ID
    
    返回分组信息及统计数据（文档数、接口数、用例数）
    """
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    stats = _get_group_stats(db, group.id)
    
    return APIGroupWithCount(
        id=group.id,
        name=group.name,
        description=group.description,
        user_id=group.user_id,
        created_at=group.created_at,
        updated_at=group.updated_at,
        **stats
    )


class PaginatedAPIResponse(BaseModel):
    """分页API列表响应"""
    items: List[APIResponse] = Field(..., description="API列表")
    total: int = Field(..., description="总数")
    page: int = Field(..., description="当前页")
    page_size: int = Field(..., description="每页数量")
    pages: int = Field(..., description="总页数")


@router.get(
    "/{group_id}/apis",
    response_model=PaginatedAPIResponse,
    summary="获取分组下的API列表",
    description="分页获取指定分组下所有API文档中解析出的接口列表"
)
async def list_group_apis(
    group_id: int,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索关键词（路径或摘要）"),
    method: Optional[str] = Query(None, description="按HTTP方法筛选"),
    is_available: Optional[bool] = Query(None, description="按可用状态筛选"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取分组下的API列表（分页）
    
    支持按路径、摘要搜索，按HTTP方法和可用状态筛选。
    """
    # 验证分组存在且属于当前用户
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    # 获取分组下的所有文档ID
    doc_ids = db.query(APIDocument.id).filter(
        APIDocument.group_id == group_id
    ).all()
    doc_id_list = [d[0] for d in doc_ids]
    
    # 构建查询
    if not doc_id_list:
        # 如果没有文档，返回空结果
        return PaginatedAPIResponse(
            items=[],
            total=0,
            page=page,
            page_size=page_size,
            pages=0
        )
    
    query = db.query(API).filter(
        API.document_id.in_(doc_id_list)
    )
    
    # 搜索过滤
    if search:
        query = query.filter(
            (API.path.ilike(f"%{search}%")) | 
            (API.summary.ilike(f"%{search}%"))
        )
    
    # 方法过滤
    if method:
        query = query.filter(API.method == method.upper())
    
    # 可用状态过滤
    if is_available is not None:
        query = query.filter(API.is_available == is_available)
    
    # 计算总数
    total = query.count()
    pages = (total + page_size - 1) // page_size
    
    # 分页
    items = query.order_by(API.path, API.method).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return PaginatedAPIResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


class PaginatedTestCaseResponse(BaseModel):
    """分页测试用例列表响应"""
    items: List[TestCaseResponse] = Field(..., description="用例列表")
    total: int = Field(..., description="总数")
    page: int = Field(..., description="当前页")
    page_size: int = Field(..., description="每页数量")
    pages: int = Field(..., description="总页数")


@router.get(
    "/{group_id}/test-cases",
    response_model=PaginatedTestCaseResponse,
    summary="获取使用分组API的测试用例",
    description="分页获取使用该分组内API的所有测试用例"
)
async def list_group_test_cases(
    group_id: int,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索关键词（名称或描述）"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取使用分组API的测试用例（分页）
    
    返回所有使用该分组下API的测试用例列表。
    """
    # 验证分组存在且属于当前用户
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    # 获取分组下的所有文档ID
    doc_ids = db.query(APIDocument.id).filter(
        APIDocument.group_id == group_id
    ).all()
    doc_id_list = [d[0] for d in doc_ids]
    
    if not doc_id_list:
        # 如果没有文档，返回空结果
        return PaginatedTestCaseResponse(
            items=[],
            total=0,
            page=page,
            page_size=page_size,
            pages=0
        )
    
    # 找出该分组下的所有API ID
    group_api_ids = db.query(API.id).filter(
        API.document_id.in_(doc_id_list)
    ).all()
    api_id_list = [a[0] for a in group_api_ids]
    
    if not api_id_list:
        # 如果没有API，返回空结果
        return PaginatedTestCaseResponse(
            items=[],
            total=0,
            page=page,
            page_size=page_size,
            pages=0
        )
    
    # 找出使用这些API的测试用例ID
    test_case_ids = db.query(func.distinct(TestCaseAPI.test_case_id)).filter(
        TestCaseAPI.api_id.in_(api_id_list)
    ).all()
    test_case_id_list = [tc[0] for tc in test_case_ids]
    
    if not test_case_id_list:
        # 如果没有测试用例，返回空结果
        return PaginatedTestCaseResponse(
            items=[],
            total=0,
            page=page,
            page_size=page_size,
            pages=0
        )
    
    # 构建测试用例查询
    query = db.query(TestCase).filter(
        TestCase.id.in_(test_case_id_list),
        TestCase.user_id == current_user.id
    )
    
    # 搜索过滤
    if search:
        query = query.filter(
            (TestCase.name.ilike(f"%{search}%")) |
            (TestCase.description.ilike(f"%{search}%"))
        )
    
    # 计算总数
    total = query.count()
    pages = (total + page_size - 1) // page_size
    
    # 分页
    items = query.order_by(TestCase.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return PaginatedTestCaseResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.put(
    "/{group_id}",
    response_model=APIGroupResponse,
    summary="更新API分组",
    description="更新指定API分组的信息"
)
async def update_api_group(
    group_id: int,
    group_update: APIGroupUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    更新API分组
    
    - **group_id**: 分组ID
    - **name**: 新的分组名称（可选）
    - **description**: 新的分组描述（可选）
    """
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    # 如果修改名称，检查是否重复
    if group_update.name and group_update.name != group.name:
        existing = db.query(APIGroup).filter(
            APIGroup.name == group_update.name,
            APIGroup.user_id == current_user.id,
            APIGroup.id != group_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="分组名称已存在"
            )
    
    update_data = group_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)
    
    db.commit()
    db.refresh(group)
    return group


@router.delete(
    "/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除API分组",
    description="删除指定的API分组（分组内的文档会被移到未分组状态）"
)
async def delete_api_group(
    group_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    删除API分组
    
    删除分组后，分组内的API文档会变为未分组状态（group_id设为NULL）。
    """
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    # 将分组内的文档移到未分组状态
    db.query(APIDocument).filter(
        APIDocument.group_id == group_id
    ).update({"group_id": None})
    
    # 删除分组的数据集
    db.query(GroupDataSet).filter(
        GroupDataSet.group_id == group_id
    ).delete()
    
    db.delete(group)
    db.commit()
    return None


# ==================== 分组数据集管理 ====================

class PaginatedDataSetResponse(BaseModel):
    """分页数据集列表响应"""
    items: List[GroupDataSetResponse] = Field(..., description="数据集列表")
    total: int = Field(..., description="总数")
    page: int = Field(..., description="当前页")
    page_size: int = Field(..., description="每页数量")
    pages: int = Field(..., description="总页数")


@router.get(
    "/{group_id}/datasets",
    response_model=PaginatedDataSetResponse,
    summary="获取分组数据集列表",
    description="获取指定分组的数据集列表"
)
async def list_group_datasets(
    group_id: int,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取分组数据集列表（分页）"""
    # 验证分组存在且属于当前用户
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    # 查询数据集
    query = db.query(GroupDataSet).filter(
        GroupDataSet.group_id == group_id
    )
    
    total = query.count()
    pages = (total + page_size - 1) // page_size
    
    items = query.order_by(GroupDataSet.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return PaginatedDataSetResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.post(
    "/{group_id}/datasets",
    response_model=GroupDataSetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建分组数据集",
    description="在指定分组中创建新的数据集"
)
async def create_group_dataset(
    group_id: int,
    dataset_data: GroupDataSetCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """创建分组数据集"""
    # 验证分组存在且属于当前用户
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    db_dataset = GroupDataSet(
        group_id=group_id,
        name=dataset_data.name,
        description=dataset_data.description,
        data=dataset_data.data
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    
    return db_dataset


@router.get(
    "/{group_id}/datasets/{dataset_id}",
    response_model=GroupDataSetResponse,
    summary="获取数据集详情",
    description="获取指定数据集的详细信息"
)
async def get_group_dataset(
    group_id: int,
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取数据集详情"""
    # 验证分组存在且属于当前用户
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    dataset = db.query(GroupDataSet).filter(
        GroupDataSet.id == dataset_id,
        GroupDataSet.group_id == group_id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="数据集不存在"
        )
    
    return dataset


@router.put(
    "/{group_id}/datasets/{dataset_id}",
    response_model=GroupDataSetResponse,
    summary="更新数据集",
    description="更新指定数据集的信息"
)
async def update_group_dataset(
    group_id: int,
    dataset_id: int,
    dataset_update: GroupDataSetUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新数据集"""
    # 验证分组存在且属于当前用户
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    dataset = db.query(GroupDataSet).filter(
        GroupDataSet.id == dataset_id,
        GroupDataSet.group_id == group_id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="数据集不存在"
        )
    
    update_data = dataset_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dataset, field, value)
    
    db.commit()
    db.refresh(dataset)
    return dataset


@router.delete(
    "/{group_id}/datasets/{dataset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除数据集",
    description="删除指定的数据集"
)
async def delete_group_dataset(
    group_id: int,
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除数据集"""
    # 验证分组存在且属于当前用户
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    dataset = db.query(GroupDataSet).filter(
        GroupDataSet.id == dataset_id,
        GroupDataSet.group_id == group_id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="数据集不存在"
        )
    
    db.delete(dataset)
    db.commit()
    return None


# ==================== 分组内手动添加接口 ====================

@router.post(
    "/{group_id}/apis",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="手动添加接口",
    description="在分组内手动添加一个API接口（不通过文档上传）"
)
async def create_manual_api(
    group_id: int,
    api_data: ManualAPICreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    手动添加接口
    
    在分组内创建一个虚拟文档并添加接口，用于手动录入API信息。
    """
    # 验证分组存在且属于当前用户
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    # 查找或创建"手动添加"虚拟文档
    manual_doc = db.query(APIDocument).filter(
        APIDocument.group_id == group_id,
        APIDocument.name == "_手动添加的接口_",
        APIDocument.user_id == current_user.id
    ).first()
    
    if not manual_doc:
        manual_doc = APIDocument(
            name="_手动添加的接口_",
            description="通过手动添加功能创建的接口集合",
            format="Manual",
            content="{}",
            user_id=current_user.id,
            group_id=group_id
        )
        db.add(manual_doc)
        db.commit()
        db.refresh(manual_doc)
    
    # 检查接口是否已存在
    existing_api = db.query(API).filter(
        API.document_id == manual_doc.id,
        API.method == api_data.method.upper(),
        API.path == api_data.path
    ).first()
    
    if existing_api:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该接口已存在"
        )
    
    # 创建接口
    parsed_request = None
    parsed_response = None
    
    if api_data.parsed_request_params:
        parsed_request = [p.dict() for p in api_data.parsed_request_params]
    
    if api_data.parsed_response_params:
        parsed_response = [p.dict() for p in api_data.parsed_response_params]
    
    # 判断是否可用（有请求或响应参数）
    is_available = bool(parsed_request or parsed_response)
    
    db_api = API(
        document_id=manual_doc.id,
        method=api_data.method.upper(),
        path=api_data.path,
        summary=api_data.summary,
        description=api_data.description,
        tags=api_data.tags or [],
        parsed_request_params=parsed_request,
        parsed_response_params=parsed_response,
        is_available=is_available,
        availability_reason=None if is_available else "缺少请求或响应参数信息"
    )
    db.add(db_api)
    db.commit()
    db.refresh(db_api)
    
    return db_api

