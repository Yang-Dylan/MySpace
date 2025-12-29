# API自动化测试平台

基于Web的API自动化测试平台，提供完整的API文档管理、测试用例生成、执行和编排能力。

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Python + FastAPI
- **数据库**: MySQL
- **认证**: JWT

## 项目结构

```
api-automation-platform/
├── frontend/          # 前端项目 (React + TypeScript + Vite)
├── backend/           # 后端项目 (Python + FastAPI)
├── docs/              # 项目文档
├── openspec/          # OpenSpec规范
└── README.md
```

## 快速开始

### 1. 数据库设置

**重要：** 在启动后端之前，需要先设置数据库。

#### 选项 A: 使用 MySQL（推荐）

1. 安装并启动 MySQL 服务
2. 创建数据库：
   ```sql
   CREATE DATABASE api_automation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. 配置数据库连接（创建 `backend/.env` 文件）：
   ```env
   DATABASE_URL=mysql+pymysql://用户名:密码@localhost:3306/api_automation?charset=utf8mb4
   ```

详细说明请查看 [DATABASE_SETUP.md](./DATABASE_SETUP.md)

#### 选项 B: 使用 SQLite（快速开始，仅开发环境）

修改 `backend/core/config.py` 中的数据库URL：
```python
DATABASE_URL: str = "sqlite:///./api_automation.db"
```

### 2. 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 初始化数据库（选择以下方法之一）

# 方法 1: 一键初始化（推荐，包含创建管理员用户）
python scripts/init_all.py

# 方法 2: 分步初始化
python scripts/init_database.py  # 创建表
python scripts/init_admin_user.py  # 创建管理员用户

# 方法 3: 使用 SQL 脚本
mysql -u dylan -p api_automation < sql/init.sql

# 方法 4: 使用 Alembic 迁移
alembic upgrade head

# 启动服务器
uvicorn main:app --reload
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

## 功能特性

- API文档管理
- 测试用例生成
- 多线程测试执行
- 数据集驱动测试
- API配置管理（重试、等待时间、依赖关系）
- 数据库管理（SQL文件执行）
- 可视化编排
- 用户认证和权限控制

## API 文档

### 在线文档

启动服务器后访问：
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### 导出文档

生成静态文档文件：

```bash
cd backend
python scripts/export_swagger.py
```

导出的文档位于 `backend/docs/` 目录：
- `swagger.json` - JSON 格式
- `swagger.yaml` - YAML 格式

可以将这些文件导入到 Postman、Insomnia 等工具中使用。

## 文档

- [用户使用指南](./docs/USER_GUIDE.md) - 用户操作手册
- [开发者指南](./docs/DEVELOPER_GUIDE.md) - 开发环境设置和开发规范
- [系统架构文档](./docs/ARCHITECTURE.md) - 系统架构和技术设计

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

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

[添加许可证信息]

