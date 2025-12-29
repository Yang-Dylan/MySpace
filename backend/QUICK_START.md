# 快速开始指南

## 一键初始化（推荐）

```bash
cd backend
python scripts/init_all.py
```

这会自动完成：
1. ✅ 创建所有数据库表
2. ✅ 创建默认管理员用户

## 默认管理员账号

- **用户名**: `admin`
- **密码**: `123456`
- **邮箱**: `admin@example.com`
- **权限**: 超级管理员（最高权限）

⚠️ **重要提示**: 请在生产环境中及时修改默认密码！

## 分步初始化

如果需要分步执行：

```bash
cd backend

# 步骤1: 创建数据库表
python scripts/init_database.py

# 步骤2: 创建管理员用户
python scripts/init_admin_user.py
```

## 验证初始化

初始化完成后，可以使用以下方式验证：

1. **测试数据库连接**:
   ```bash
   python test_db_connection.py
   ```

2. **登录测试**:
   - 启动后端服务: `uvicorn main:app --reload`
   - 访问前端: `http://localhost:5173`
   - 使用 admin/123456 登录

## 常见问题

### 1. 数据库连接失败
- 检查 MySQL 服务是否运行
- 检查 `backend/core/config.py` 中的数据库配置
- 确保数据库 `api_automation` 已创建

### 2. 用户已存在
- 如果 admin 用户已存在，脚本会跳过创建
- 可以手动删除后重新运行，或直接使用现有账号

### 3. 权限问题
- 确保数据库用户有 CREATE TABLE 和 INSERT 权限

