"""
API文档管理模块测试
"""
import pytest
from fastapi import status


def test_upload_api_doc(client, auth_headers):
    """测试上传API文档"""
    # 创建模拟的OpenAPI文档
    openapi_content = {
        "openapi": "3.0.0",
        "info": {"title": "Test API", "version": "1.0.0"},
        "paths": {
            "/test": {
                "get": {
                    "summary": "Test endpoint",
                    "responses": {"200": {"description": "Success"}}
                }
            }
        }
    }
    
    import json
    files = {
        "file": ("test.json", json.dumps(openapi_content), "application/json")
    }
    
    response = client.post(
        "/api/api-docs/upload",
        headers=auth_headers,
        files=files
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["name"] == "test.json"


def test_list_api_docs(client, auth_headers):
    """测试获取API文档列表"""
    response = client.get("/api/api-docs/", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_get_api_doc(client, auth_headers):
    """测试获取API文档详情"""
    # 先创建一个文档
    openapi_content = {
        "openapi": "3.0.0",
        "info": {"title": "Test API", "version": "1.0.0"},
        "paths": {}
    }
    
    import json
    files = {
        "file": ("test.json", json.dumps(openapi_content), "application/json")
    }
    
    create_response = client.post(
        "/api/api-docs/upload",
        headers=auth_headers,
        files=files
    )
    doc_id = create_response.json()["id"]
    
    # 获取文档详情
    response = client.get(f"/api/api-docs/{doc_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == doc_id


