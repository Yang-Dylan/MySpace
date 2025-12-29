# 系统架构文档

## 概述

API自动化测试平台采用前后端分离的架构，后端使用FastAPI提供RESTful API，前端使用React构建用户界面。

## 架构图

```
┌─────────────────┐
│   前端 (React)   │
│  - 用户界面      │
│  - 状态管理      │
│  - API调用      │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│ 后端 (FastAPI)  │
│  - API路由      │
│  - 业务逻辑     │
│  - 数据验证     │
└────────┬────────┘
         │
┌────────▼────────┐
│  数据库 (MySQL)  │
│  - 数据存储      │
│  - 关系管理      │
└─────────────────┘
```

## 技术架构

### 前端架构

- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **路由**: React Router
- **状态管理**: React Context + Hooks
- **HTTP客户端**: Axios
- **UI组件**: 原生HTML/CSS（可扩展为组件库）

### 后端架构

- **框架**: FastAPI
- **语言**: Python 3.9+
- **ORM**: SQLAlchemy 2.0
- **数据库**: MySQL 8.0+
- **认证**: JWT
- **API文档**: OpenAPI/Swagger

## 模块划分

### 后端模块

1. **认证模块** (`api/routers/auth.py`)
   - 用户注册、登录
   - JWT令牌管理
   - 权限验证

2. **API文档管理** (`api/routers/api_doc.py`)
   - 文档上传和解析
   - API信息提取
   - 文档CRUD操作

3. **测试用例管理** (`api/routers/test_case.py`)
   - 测试用例CRUD
   - API组装
   - 权限控制

4. **API配置管理** (`api/routers/api_config.py`)
   - 重试机制配置
   - 等待时间配置
   - 依赖关系管理

5. **测试执行引擎** (`api/routers/test_execution.py`)
   - 多线程执行
   - 数据集驱动
   - 结果收集

6. **可视化编排** (`api/routers/orchestration.py`)
   - 编排流程管理
   - 字段映射配置

7. **数据库管理** (`api/routers/database_management.py`)
   - SQL文件管理
   - SQL执行和验证

### 前端模块

1. **认证模块** (`pages/Login.tsx`, `pages/Register.tsx`)
   - 登录和注册界面
   - 认证状态管理

2. **API文档管理** (`pages/ApiDocList.tsx`, `pages/ApiDocUpload.tsx`)
   - 文档列表和上传
   - 文档详情查看

3. **测试用例管理** (`pages/TestCaseList.tsx`, `pages/TestCaseCreate.tsx`)
   - 测试用例列表和创建
   - 测试用例详情和编辑

4. **测试执行** (`pages/TestExecutionList.tsx`, `pages/TestCaseExecute.tsx`)
   - 执行列表和详情
   - 执行启动和结果查看

5. **可视化编排** (`pages/OrchestrationEditor.tsx`)
   - 拖拽式编排界面
   - 字段映射配置

## 数据流

### API请求流程

```
用户操作
  ↓
前端组件
  ↓
API客户端 (api/*.ts)
  ↓
HTTP请求 (Axios)
  ↓
后端路由 (api/routers/*.py)
  ↓
业务逻辑 (services/*.py)
  ↓
数据模型 (models/*.py)
  ↓
数据库 (MySQL)
```

### 认证流程

```
用户登录
  ↓
后端验证用户名密码
  ↓
生成JWT令牌
  ↓
返回令牌给前端
  ↓
前端存储令牌
  ↓
后续请求携带令牌
  ↓
后端验证令牌
  ↓
允许访问
```

## 数据模型关系

### 核心实体关系

```
User (用户)
  ├── APIDocument (API文档)
  │     └── API (API接口)
  ├── TestCase (测试用例)
  │     └── TestCaseAPI (测试用例API配置)
  ├── APIConfig (API配置)
  │     └── APIDependency (API依赖)
  ├── TestExecution (测试执行)
  │     └── TestExecutionResult (执行结果)
  ├── OrchestrationFlow (编排流程)
  │     └── FieldMapping (字段映射)
  └── SQLFile (SQL文件)
        └── DatabaseOperation (数据库操作)
```

## 安全设计

### 认证机制

- 使用JWT进行无状态认证
- 密码使用bcrypt加密存储
- 令牌有过期时间限制

### 权限控制

- 基于用户的数据隔离
- 支持角色和权限扩展
- API级别的权限验证

### 数据安全

- SQL注入防护（使用ORM）
- XSS防护（前端转义）
- CSRF防护（JWT令牌）

## 性能优化

### 后端优化

- 数据库连接池
- 查询优化（索引、关联查询）
- 异步处理（可选）

### 前端优化

- 代码分割
- 懒加载
- 缓存策略

## 扩展性设计

### 水平扩展

- 无状态API设计，支持多实例部署
- 数据库读写分离（可选）
- 负载均衡（可选）

### 功能扩展

- 模块化设计，易于添加新功能
- 插件化架构（可选）
- 微服务化（可选）

## 监控和日志

### 日志记录

- 请求日志
- 错误日志
- 执行日志

### 监控指标

- API响应时间
- 错误率
- 执行成功率

## 部署架构

### 开发环境

```
前端 (Vite Dev Server) → 后端 (Uvicorn) → MySQL
```

### 生产环境

```
Nginx → 前端 (静态文件) + 后端 (Uvicorn/Gunicorn) → MySQL
```

## 未来规划

1. **容器化部署**: Docker + Kubernetes
2. **消息队列**: 异步任务处理
3. **缓存系统**: Redis缓存
4. **监控系统**: Prometheus + Grafana
5. **CI/CD**: 自动化测试和部署


