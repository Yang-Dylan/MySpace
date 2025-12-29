# 数据库初始化脚本

## 设计原则

⚠️ **重要**：本项目数据库设计**不使用外键约束（FOREIGN KEY）**

理由：
- 便于数据迁移和分布式部署
- 避免外键导致的锁竞争和性能问题
- 数据完整性由应用层维护
- 简化开发和测试流程

## 脚本说明

- `init_all.py`: 一键初始化脚本（创建表 + 管理员用户）⭐ 推荐
- `init_database.py`: 使用 SQLAlchemy 自动创建所有数据库表
- `init_admin_user.py`: 创建默认管理员用户（admin/123456）
- `export_swagger.py`: 导出 OpenAPI/Swagger 文档

## 使用方法

### 方法 1: 一键初始化（推荐）

```bash
cd backend
python scripts/init_all.py
```

这会：
1. 创建所有数据库表
2. 创建默认管理员用户（用户名: admin, 密码: 123456）

### 方法 2: 分步初始化

```bash
cd backend

# 步骤1: 创建数据库表
python scripts/init_database.py

# 步骤2: 创建管理员用户
python scripts/init_admin_user.py
```

### 方法 3: 使用 SQL 脚本

```bash
mysql -u dylan -p api_automation < sql/init.sql
```

注意：SQL 脚本不包含管理员用户（需要密码哈希），建议使用 Python 脚本。

### 方法 4: 使用 Alembic 迁移

```bash
cd backend
alembic upgrade head
```

## 默认管理员账号

- **用户名**: admin
- **密码**: 123456
- **邮箱**: admin@example.com
- **权限**: 超级管理员（is_superuser=True）

⚠️ **重要**: 请在生产环境中及时修改默认密码！

## 注意事项

1. 执行前确保：
   - MySQL 服务正在运行
   - 数据库 `api_automation` 已创建
   - 数据库连接配置正确（`backend/core/config.py` 或 `.env` 文件）

2. 如果表或用户已存在，脚本会跳过创建（不会报错）

3. 建议使用 Alembic 进行数据库版本管理

4. 管理员用户密码使用 bcrypt 加密存储

5. **数据库表不使用外键约束**，数据关联由应用层维护

