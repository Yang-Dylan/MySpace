# SQL 初始化脚本

## 设计原则

⚠️ **重要**：本项目数据库设计**不使用外键约束（FOREIGN KEY）**

理由：
- 便于数据迁移和分布式部署
- 避免外键导致的锁竞争和性能问题
- 数据完整性由应用层维护
- 简化开发和测试流程

## 文件说明

- `init.sql`: 数据库初始化脚本，包含所有表的创建语句（无外键约束）
- `init_admin_user.sql`: 管理员用户初始化（不推荐，密码需要哈希）

## 使用方法

### 方法 1: 一键初始化（推荐）

```bash
cd backend
python scripts/init_all.py
```

这会自动：
1. 创建所有数据库表
2. 创建默认管理员用户（admin/123456）

### 方法 2: 直接执行 SQL 脚本

```bash
# 确保 MySQL 服务正在运行
mysql -u dylan -p api_automation < sql/init.sql

# 或者交互式执行
mysql -u dylan -p
source sql/init.sql
```

### 方法 3: 使用 Alembic 迁移

```bash
cd backend

# 生成迁移文件
alembic revision --autogenerate -m "Initial migration"

# 执行迁移
alembic upgrade head
```

## 注意事项

1. 执行前请确保：
   - MySQL 服务正在运行
   - 数据库 `api_automation` 已创建
   - 有足够的权限执行 DDL 语句

2. 如果表已存在，脚本会跳过创建（使用 `CREATE TABLE IF NOT EXISTS`）

3. **不使用外键约束**：
   - 所有表之间使用 INDEX 优化查询
   - 数据关联性由应用层（Python 代码）维护
   - 删除关联数据时需在应用层处理级联

4. 字符集：
   - 所有表使用 `utf8mb4` 字符集
   - 排序规则使用 `utf8mb4_unicode_ci`

## 表结构说明

### 用户认证相关
- `users`: 用户表
- `roles`: 角色表
- `permissions`: 权限表
- `test_case_permissions`: 测试用例权限表

### API文档管理相关
- `api_groups`: API分组表
- `api_documents`: API文档表
- `apis`: API表（从文档解析出的API）

### 测试用例相关
- `test_cases`: 测试用例表
- `test_case_apis`: 测试用例API配置表

### API配置相关
- `api_configs`: API配置表

### 测试执行相关
- `test_executions`: 测试执行记录表
- `test_execution_results`: 测试执行结果表
- `test_data_sets`: 测试数据集表

### 数据库管理相关
- `sql_files`: SQL文件表
- `database_operations`: 数据库操作记录表

### 可视化编排相关
- `orchestration_flows`: 编排流程表
- `field_mappings`: 字段映射表

## 后续扩展

当添加新的模型时，需要：
1. 更新 `init.sql` 脚本（不要添加外键）
2. 使用 Alembic 生成新的迁移文件
3. 执行迁移更新数据库结构
