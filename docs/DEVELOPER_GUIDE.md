# 开发者指南

## 项目架构

### 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Python 3.9+ + FastAPI
- **数据库**: MySQL 8.0+
- **ORM**: SQLAlchemy 2.0
- **认证**: JWT (JSON Web Tokens)
- **API文档**: OpenAPI/Swagger

### 项目结构

```
api-automation-platform/
├── frontend/                 # 前端项目 (React + TypeScript + Vite)
│   ├── src/
│   │   ├── api/              # API客户端
│   │   ├── components/       # 通用组件
│   │   ├── contexts/         # React Context
│   │   ├── pages/            # 页面组件
│   │   └── main.tsx          # 入口文件
│   ├── package.json          # 前端依赖配置
│   └── vite.config.ts        # Vite配置
├── backend/                  # 后端项目 (Python + FastAPI)
│   ├── api/                   # API路由
│   │   └── routers/           # 路由模块
│   ├── core/                  # 核心配置
│   │   ├── config.py          # 应用配置
│   │   ├── database.py        # 数据库配置
│   │   └── security.py        # 安全相关
│   ├── models/                # 数据模型
│   ├── schemas/               # Pydantic模式
│   ├── services/              # 业务逻辑
│   ├── tests/                 # 测试文件
│   ├── scripts/               # 工具脚本
│   └── main.py                # 应用入口
├── openspec/                  # OpenSpec规范
└── docs/                      # 文档
```

## 开发环境设置

### 1. 后端设置

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 数据库设置

创建MySQL数据库：

```sql
CREATE DATABASE api_automation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

配置数据库连接（`backend/core/config.py`）：

```python
DATABASE_URL: str = "mysql+pymysql://用户名:密码@localhost:3306/api_automation?charset=utf8mb4"
```

### 3. 初始化数据库

```bash
python scripts/init_all.py
```

### 4. 启动后端服务

```bash
uvicorn main:app --reload
```

### 5. 前端设置

```bash
cd frontend
npm install
npm run dev
```

## 代码规范

### Python代码规范

- 遵循PEP 8代码风格
- 使用类型提示（Type Hints）
- 函数和类添加文档字符串
- 使用Black格式化代码（可选）

### TypeScript代码规范

- 使用TypeScript严格模式
- 遵循ESLint规则
- 组件使用函数式组件和Hooks
- 使用接口定义类型

## 核心模块说明

### 1. 用户认证模块 (`api/routers/auth.py`)

- 用户注册和登录
- JWT令牌生成和验证
- 密码加密（使用bcrypt）

### 2. API文档管理模块 (`api/routers/api_doc.py`)

- API文档上传和解析
- OpenAPI/Swagger格式支持
- API信息提取和存储

### 3. 测试用例模块 (`api/routers/test_case.py`)

- 测试用例CRUD操作
- API组装和配置
- 权限控制

### 4. API配置模块 (`api/routers/api_config.py`)

- 重试机制配置
- 等待时间配置
- 依赖关系配置和解析

### 5. 测试执行模块 (`api/routers/test_execution.py`)

- 多线程测试执行
- 数据集驱动测试
- 结果收集和存储

### 6. 可视化编排模块 (`api/routers/orchestration.py`)

- 编排流程管理
- 字段映射配置
- 流程应用到测试用例

### 7. 数据库管理模块 (`api/routers/database_management.py`)

- SQL文件管理
- SQL验证和执行
- 操作记录

## 数据库模型

### 核心模型

- **User**: 用户表
- **APIDocument**: API文档表
- **API**: API接口表
- **TestCase**: 测试用例表
- **TestCaseAPI**: 测试用例API配置表
- **APIConfig**: API配置表
- **APIDependency**: API依赖关系表
- **TestExecution**: 测试执行记录表
- **TestExecutionResult**: 测试执行结果表
- **OrchestrationFlow**: 编排流程表
- **FieldMapping**: 字段映射表
- **SQLFile**: SQL文件表
- **DatabaseOperation**: 数据库操作记录表

## API设计规范

### RESTful API设计

- 使用标准HTTP方法（GET, POST, PUT, DELETE）
- 使用资源名词（复数形式）
- 使用HTTP状态码表示结果
- 统一的错误响应格式

### 认证方式

所有需要认证的API都需要在请求头中包含JWT令牌：

```
Authorization: Bearer <token>
```

### 响应格式

成功响应：

```json
{
  "id": 1,
  "name": "example",
  ...
}
```

错误响应：

```json
{
  "detail": "错误信息"
}
```

## 测试

### 运行测试

```bash
cd backend
pytest tests/
```

### 测试覆盖率

```bash
pytest --cov=. --cov-report=html tests/
```

### 测试结构

- `tests/test_auth.py`: 认证模块测试
- `tests/test_api_doc.py`: API文档管理测试
- `tests/conftest.py`: 测试配置和fixtures

## 部署

### 生产环境配置

1. 设置环境变量：
   ```bash
   export DATABASE_URL="mysql+pymysql://..."
   export SECRET_KEY="your-secret-key"
   export DEBUG=False
   ```

2. 构建前端：
   ```bash
   cd frontend
   npm run build
   ```

3. 启动后端：
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Docker部署（可选）

创建 `Dockerfile` 和 `docker-compose.yml` 进行容器化部署。

## 扩展开发

### 添加新功能模块

1. 创建数据模型（`models/`）
2. 创建Pydantic模式（`schemas/`）
3. 创建业务逻辑（`services/`）
4. 创建API路由（`api/routers/`）
5. 注册路由（`main.py`）
6. 创建前端页面（`frontend/src/pages/`）

### 添加新的API端点

1. 在对应的路由文件中添加端点
2. 添加请求/响应模式
3. 实现业务逻辑
4. 添加单元测试
5. 更新API文档

## 常见问题

### Q: 如何添加新的数据库表？

A: 
1. 在 `models/` 中创建模型
2. 在 `models/__init__.py` 中导入
3. 运行数据库迁移或使用 `init_database.py`

### Q: 如何添加新的前端页面？

A:
1. 在 `frontend/src/pages/` 中创建页面组件
2. 在 `frontend/src/App.tsx` 中添加路由
3. 在导航菜单中添加链接

### Q: 如何调试API？

A:
- 使用Swagger UI: http://localhost:8000/docs
- 查看后端日志
- 使用Postman或curl测试

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

[添加许可证信息]

