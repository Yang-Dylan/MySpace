"""
API自动化测试平台 - 后端主入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.routers import auth, api_doc, api_group, test_case, api_config, test_execution, test_data_set, database_management, orchestration

app = FastAPI(
    title="API自动化测试平台",
    description="""
    ## API自动化测试平台 API 文档
    
    基于Web的API自动化测试平台，提供完整的API文档管理、测试用例生成、执行和编排能力。
    
    ### 功能特性
    
    * 🔐 **用户认证**: JWT 认证，支持用户注册和登录
    * 📄 **API文档管理**: 上传、查看、编辑和删除 OpenAPI/Swagger 文档
    * 🧪 **测试用例生成**: 基于API文档组装生成测试用例
    * ⚡ **测试执行**: 支持多线程数据集执行测试用例
    * ⚙️ **API配置**: 支持重试机制、等待时间和依赖关系配置
    * 🗄️ **数据库管理**: 通过SQL文件管理数据库初始化和清理
    * 🎨 **可视化编排**: 通过拖拽方式配置API顺序和字段关联关系
    * 🔒 **权限控制**: 细粒度的数据权限控制
    
    ### 认证方式
    
    大部分API需要JWT认证。请先通过 `/api/auth/login` 获取 token，然后在请求头中添加：
    
    ```
    Authorization: Bearer <your_token>
    ```
    
    ### 快速开始
    
    1. 注册用户: `POST /api/auth/register`
    2. 登录获取token: `POST /api/auth/login`
    3. 使用token访问其他API
    """,
    version="1.0.0",
    contact={
        "name": "API自动化测试平台",
        "email": "admin@example.com",
    },
    license_info={
        "name": "MIT",
    },
    tags_metadata=[
        {
            "name": "auth",
            "description": "用户认证相关接口，包括注册、登录和用户信息查询",
        },
        {
            "name": "api-groups",
            "description": "API分组管理接口，支持创建分组并将API文档归类到不同分组",
        },
        {
            "name": "api-docs",
            "description": "API文档管理接口，支持上传、查看、编辑和删除OpenAPI/Swagger文档，支持分组选择和API标签管理",
        },
        {
            "name": "test-cases",
            "description": "测试用例管理接口，支持创建、查看、编辑和删除测试用例，支持数据集字段映射和API间字段映射",
        },
        {
            "name": "api-configs",
            "description": "API配置管理接口，支持配置重试机制、等待时间和依赖关系",
        },
        {
            "name": "test-executions",
            "description": "测试执行接口，支持多线程执行、数据集驱动和结果查询",
        },
        {
            "name": "test-data-sets",
            "description": "测试数据集管理接口，支持创建和管理测试数据集",
        },
        {
            "name": "database",
            "description": "数据库管理接口，支持SQL文件上传、验证和执行",
        },
        {
            "name": "orchestration",
            "description": "可视化编排接口，支持拖拽式API编排和字段映射配置",
        },
    ],
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(api_group.router)
app.include_router(api_doc.router)
app.include_router(test_case.router)
app.include_router(api_config.router)
app.include_router(test_execution.router)
app.include_router(test_data_set.router)
app.include_router(database_management.router)
app.include_router(orchestration.router)

@app.get("/")
async def root():
    """根路径"""
    return {"message": "API自动化测试平台 API", "version": "1.0.0"}

@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

