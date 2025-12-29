"""
API文档管理路由
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from core.database import get_db
from api.dependencies import get_current_active_user
from models.user import User
from models.api_doc import APIDocument, API, APIGroup
from models.test_case import TestCase, TestCaseAPI
from schemas.api_doc import (
    APIDocumentCreate, APIDocumentUpdate, APIDocumentResponse, 
    APIResponse, APIUpdate, APIDetailResponse, TaggedAPIQuery
)
from pydantic import BaseModel, Field
from services.api_doc_parser import APIDocParser

router = APIRouter(prefix="/api/api-docs", tags=["api-docs"])


class UploadResponse(BaseModel):
    """上传响应"""
    id: int
    name: str
    format: Optional[str] = None
    user_id: int
    group_id: Optional[int] = None
    created_at: str
    apis_count: int = Field(0, description="解析出的API数量")
    parse_error: Optional[str] = Field(None, description="解析错误信息")
    
    class Config:
        from_attributes = True


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="上传API文档",
    description="上传OpenAPI或Swagger格式的API文档文件，可选择所属分组或创建新分组",
    responses={
        201: {"description": "上传成功"},
        401: {"description": "未认证"},
        404: {"description": "分组不存在"},
    }
)
async def upload_api_document(
    file: UploadFile = File(..., description="OpenAPI/Swagger文档文件（支持.json, .yaml, .yml格式）"),
    group_id: Optional[int] = Form(None, description="所属API分组ID（与new_group_name二选一）"),
    new_group_name: Optional[str] = Form(None, description="新建分组名称（与group_id二选一）"),
    new_group_description: Optional[str] = Form(None, description="新建分组描述"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    上传API文档
    
    支持上传 OpenAPI 3.0 或 Swagger 2.0 格式的文档文件。
    上传后系统会自动解析文档内容，提取API信息。
    
    - **支持格式**: JSON (.json) 或 YAML (.yaml, .yml)
    - **group_id**: 可选，指定所属API分组
    - **new_group_name**: 可选，新建分组名称（与group_id二选一）
    - **new_group_description**: 可选，新建分组描述
    - **文件大小限制**: 建议不超过 10MB
    
    解析后的API会自动提取请求参数和响应参数。如果参数信息不完整，
    API会被标记为"不可用"状态，需要手动编辑后才能使用。
    """
    # 处理分组：选择现有分组或新建分组
    final_group_id = group_id
    
    if new_group_name:
        # 新建分组
        # 检查名称是否重复
        existing = db.query(APIGroup).filter(
            APIGroup.name == new_group_name,
            APIGroup.user_id == current_user.id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"分组名称'{new_group_name}'已存在"
            )
        
        new_group = APIGroup(
            name=new_group_name,
            description=new_group_description,
            user_id=current_user.id
        )
        db.add(new_group)
        db.flush()  # 获取新分组ID
        final_group_id = new_group.id
    elif group_id:
        # 验证分组是否存在
        group = db.query(APIGroup).filter(
            APIGroup.id == group_id,
            APIGroup.user_id == current_user.id
        ).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定的API分组不存在"
            )
    
    # 读取文件内容
    content = await file.read()
    content_str = content.decode("utf-8")
    
    # 确定文档格式
    file_format = "OpenAPI"
    if file.filename.endswith(".yaml") or file.filename.endswith(".yml"):
        file_format = "OpenAPI"
    elif file.filename.endswith(".json"):
        file_format = "OpenAPI"
    
    # 创建文档记录
    db_doc = APIDocument(
        name=file.filename,
        format=file_format,
        content=content_str,
        user_id=current_user.id,
        group_id=final_group_id
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    # 解析文档并创建API记录
    parse_error = None
    apis_count = 0
    try:
        parser = APIDocParser()
        apis_data = parser.parse_openapi(content_str)
        
        for api_data in apis_data:
            # 解析请求和响应参数
            parsed_request = parser.extract_request_params(api_data)
            parsed_response = parser.extract_response_params(api_data)
            
            # 判断是否可用（有参数信息才可用）
            is_available = bool(parsed_request or parsed_response)
            availability_reason = None if is_available else "缺少请求或响应参数信息，请手动编辑完善"
            
            db_api = API(
                document_id=db_doc.id,
                method=api_data.get("method"),
                path=api_data.get("path"),
                summary=api_data.get("summary"),
                description=api_data.get("description"),
                request_schema=api_data.get("request_schema"),
                response_schema=api_data.get("response_schema"),
                parsed_request_params=parsed_request,
                parsed_response_params=parsed_response,
                is_available=is_available,
                availability_reason=availability_reason,
                tags=api_data.get("tags", [])  # 保存原始标签
            )
            db.add(db_api)
            apis_count += 1
        
        db.commit()
        print(f"[API文档上传] 文档ID={db_doc.id}, 分组ID={final_group_id}, 解析API数量={apis_count}")
    except Exception as e:
        # 记录解析错误，但保留文档
        parse_error = str(e)
        print(f"[API文档上传] 解析失败: {parse_error}")
        # 更新文档说明解析失败
        db_doc.description = f"解析API失败: {parse_error}"
        db.commit()
    
    return UploadResponse(
        id=db_doc.id,
        name=db_doc.name,
        format=db_doc.format,
        user_id=db_doc.user_id,
        group_id=db_doc.group_id,
        created_at=db_doc.created_at.isoformat() if db_doc.created_at else "",
        apis_count=apis_count,
        parse_error=parse_error
    )


@router.get(
    "/",
    response_model=List[APIDocumentResponse],
    summary="获取API文档列表",
    description="获取当前用户的所有API文档列表",
    responses={
        200: {"description": "获取成功"},
        401: {"description": "未认证"},
    }
)
async def list_api_documents(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取API文档列表
    
    返回当前用户的所有API文档，支持分页。
    
    - **skip**: 跳过的记录数（默认: 0）
    - **limit**: 返回的最大记录数（默认: 100，最大: 1000）
    """
    docs = db.query(APIDocument).filter(
        APIDocument.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return docs


@router.get("/{doc_id}", response_model=APIDocumentResponse)
async def get_api_document(
    doc_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取API文档详情"""
    doc = db.query(APIDocument).filter(
        APIDocument.id == doc_id,
        APIDocument.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API document not found"
        )
    
    return doc


@router.get("/{doc_id}/apis", response_model=List[APIResponse])
async def get_document_apis(
    doc_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取文档中的API列表"""
    doc = db.query(APIDocument).filter(
        APIDocument.id == doc_id,
        APIDocument.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API document not found"
        )
    
    apis = db.query(API).filter(API.document_id == doc_id).all()
    return apis


@router.put("/{doc_id}", response_model=APIDocumentResponse)
async def update_api_document(
    doc_id: int,
    doc_update: APIDocumentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新API文档"""
    doc = db.query(APIDocument).filter(
        APIDocument.id == doc_id,
        APIDocument.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API document not found"
        )
    
    update_data = doc_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doc, field, value)
    
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_document(
    doc_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除API文档"""
    doc = db.query(APIDocument).filter(
        APIDocument.id == doc_id,
        APIDocument.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API document not found"
        )
    
    # 先删除关联的所有API记录（因为document_id是NOT NULL的）
    db.query(API).filter(API.document_id == doc_id).delete()
    
    # 再删除文档
    db.delete(doc)
    db.commit()
    return None


# ==================== API单个接口管理 ====================

@router.get(
    "/apis/{api_id}",
    response_model=APIDetailResponse,
    summary="获取API详情",
    description="获取单个API的详细信息，包含完整的请求和响应参数"
)
async def get_api_detail(
    api_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取API详情
    
    返回API的完整信息，包括：
    - 基本信息（方法、路径、描述）
    - 标签列表
    - 可用状态
    - 解析后的请求参数
    - 解析后的响应参数
    - 原始JSON Schema
    """
    api = db.query(API).filter(API.id == api_id).first()
    
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API不存在"
        )
    
    # 验证用户权限
    doc = db.query(APIDocument).filter(
        APIDocument.id == api.document_id,
        APIDocument.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此API"
        )
    
    return api


@router.put(
    "/apis/{api_id}",
    response_model=APIResponse,
    summary="更新API",
    description="更新API的标签、参数信息和可用状态"
)
async def update_api(
    api_id: int,
    api_update: APIUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    更新API
    
    可更新的字段：
    - **tags**: API标签列表（如["token", "auth"]）
    - **is_available**: 是否可用
    - **parsed_request_params**: 请求参数列表
    - **parsed_response_params**: 响应参数列表
    
    当手动补充参数信息后，可将is_available设为true使API可用。
    """
    api = db.query(API).filter(API.id == api_id).first()
    
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API不存在"
        )
    
    # 验证用户权限
    doc = db.query(APIDocument).filter(
        APIDocument.id == api.document_id,
        APIDocument.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此API"
        )
    
    update_data = api_update.dict(exclude_unset=True)
    
    # 如果更新了参数信息，自动更新可用状态
    if "parsed_request_params" in update_data or "parsed_response_params" in update_data:
        has_params = bool(
            update_data.get("parsed_request_params") or 
            api.parsed_request_params or
            update_data.get("parsed_response_params") or 
            api.parsed_response_params
        )
        if has_params and api_update.is_available is None:
            update_data["is_available"] = True
            update_data["availability_reason"] = None
    
    for field, value in update_data.items():
        # 处理参数列表的序列化
        if field in ["parsed_request_params", "parsed_response_params"] and value:
            value = [p.dict() if hasattr(p, 'dict') else p for p in value]
        setattr(api, field, value)
    
    db.commit()
    db.refresh(api)
    return api


@router.get(
    "/by-tag",
    response_model=List[APIResponse],
    summary="按标签查询API",
    description="获取具有指定标签的API列表，可用于选择公共接口（如token接口）"
)
async def get_apis_by_tag(
    tag: str = Query(..., description="要查询的标签", example="token"),
    group_id: Optional[int] = Query(None, description="限制在指定分组内查询"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    按标签查询API
    
    查询具有指定标签的API列表。常用于：
    - 获取token接口：tag=token
    - 获取认证接口：tag=auth
    - 获取公共接口：tag=public
    
    可以限制在指定分组内查询，确保只返回同分组的API。
    """
    # 构建查询
    query = db.query(API).join(
        APIDocument, API.document_id == APIDocument.id
    ).filter(
        APIDocument.user_id == current_user.id,
        API.is_available == True
    )
    
    # 限制分组
    if group_id:
        query = query.filter(APIDocument.group_id == group_id)
    
    # 获取所有API并过滤标签
    apis = query.all()
    
    # 过滤具有指定标签的API
    result = []
    for api in apis:
        if api.tags and tag in api.tags:
            result.append(api)
    
    return result


@router.get(
    "/by-group/{group_id}",
    response_model=List[APIResponse],
    summary="获取分组内的API列表",
    description="获取指定分组下所有文档中的API列表"
)
async def get_apis_by_group(
    group_id: int,
    only_available: bool = Query(False, description="是否只返回可用的API"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取分组内的API列表
    
    返回指定分组下所有API文档中的API。
    用于测试用例创建时限制只能选择同分组的API。
    
    - **group_id**: 分组ID
    - **only_available**: 是否只返回可用的API（默认false）
    """
    # 验证分组归属
    group = db.query(APIGroup).filter(
        APIGroup.id == group_id,
        APIGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API分组不存在"
        )
    
    # 查询分组内的API
    query = db.query(API).join(
        APIDocument, API.document_id == APIDocument.id
    ).filter(
        APIDocument.group_id == group_id
    )
    
    if only_available:
        query = query.filter(API.is_available == True)
    
    return query.all()


# ==================== 接口关联用例查询 ====================

class APIRelatedTestCase(BaseModel):
    """接口关联的用例信息"""
    id: int = Field(..., description="用例ID")
    name: str = Field(..., description="用例名称")
    description: Optional[str] = Field(None, description="用例描述")
    created_at: datetime = Field(..., description="创建时间")


class APIRelatedTestCasesResponse(BaseModel):
    """接口关联用例列表响应"""
    items: List[APIRelatedTestCase] = Field(..., description="关联用例列表")
    total: int = Field(..., description="总数")


@router.get(
    "/apis/{api_id}/test-cases",
    response_model=APIRelatedTestCasesResponse,
    summary="获取接口关联的用例",
    description="获取使用指定接口的所有测试用例列表"
)
async def get_api_related_test_cases(
    api_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取接口关联的用例
    
    返回所有使用该接口的测试用例列表。
    """
    # 验证API存在且用户有权限访问
    api = db.query(API).filter(API.id == api_id).first()
    
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API不存在"
        )
    
    # 验证文档归属
    doc = db.query(APIDocument).filter(
        APIDocument.id == api.document_id,
        APIDocument.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此API"
        )
    
    # 查询使用该API的测试用例
    test_case_ids = db.query(TestCaseAPI.test_case_id).filter(
        TestCaseAPI.api_id == api_id
    ).distinct().all()
    
    test_case_id_list = [tc[0] for tc in test_case_ids]
    
    if not test_case_id_list:
        return APIRelatedTestCasesResponse(items=[], total=0)
    
    test_cases = db.query(TestCase).filter(
        TestCase.id.in_(test_case_id_list),
        TestCase.user_id == current_user.id
    ).all()
    
    items = [
        APIRelatedTestCase(
            id=tc.id,
            name=tc.name,
            description=tc.description,
            created_at=tc.created_at
        )
        for tc in test_cases
    ]
    
    return APIRelatedTestCasesResponse(items=items, total=len(items))

