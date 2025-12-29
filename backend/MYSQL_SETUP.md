# MySQL 快速设置指南

## 1. 安装 MySQL

### Windows
1. 下载 MySQL Installer: https://dev.mysql.com/downloads/installer/
2. 运行安装程序，选择 "Developer Default" 或 "Server only"
3. 记住设置的 root 密码

### Linux
```bash
sudo apt-get update
sudo apt-get install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### macOS
```bash
brew install mysql
brew services start mysql
```

## 2. 创建数据库

```sql
mysql -u root -p

CREATE DATABASE api_automation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

## 3. 配置连接

创建 `backend/.env` 文件：

```env
DATABASE_URL=mysql+pymysql://root:你的密码@localhost:3306/api_automation?charset=utf8mb4
```

或者修改 `backend/core/config.py`：

```python
DATABASE_URL: str = "mysql+pymysql://root:你的密码@localhost:3306/api_automation?charset=utf8mb4"
```

## 4. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

## 5. 运行数据库迁移

```bash
cd backend
alembic upgrade head
```

如果还没有迁移文件，先创建：

```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## 6. 测试连接

```bash
cd backend
python test_db_connection.py
```

## 注意事项

1. **字符编码**: 必须使用 `utf8mb4` 以支持完整的 Unicode 字符（包括 emoji）
2. **连接字符串格式**: `mysql+pymysql://用户名:密码@主机:端口/数据库名?charset=utf8mb4`
3. **端口**: MySQL 默认端口是 3306
4. **密码特殊字符**: 如果密码包含特殊字符，需要进行 URL 编码

