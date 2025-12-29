# 数据库设置指南

## MySQL 连接错误解决方案

如果遇到以下错误：
```
pymysql.err.OperationalError: (2003, "Can't connect to MySQL server")
```

这表示 MySQL 数据库服务器没有运行或未正确配置。

## 解决方案

### 方案 1: 安装并启动 MySQL（推荐）

#### Windows

1. **下载并安装 MySQL**
   - 访问 https://dev.mysql.com/downloads/mysql/
   - 下载 MySQL Installer for Windows
   - 安装时记住设置的 root 用户密码

2. **启动 MySQL 服务**
   ```powershell
   # 方法1: 使用服务管理器
   # 打开"服务"管理器（services.msc），找到 MySQL 服务并启动
   
   # 方法2: 使用命令行
   net start MySQL80  # 版本号可能不同，请根据实际安装版本调整
   ```

3. **创建数据库**
   ```sql
   # 使用 MySQL 命令行工具
   mysql -u root -p
   
   # 在 MySQL 中执行
   CREATE DATABASE api_automation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

4. **配置数据库连接**
   创建 `backend/.env` 文件：
   ```env
   DATABASE_URL=mysql+pymysql://root:你的密码@localhost:3306/api_automation?charset=utf8mb4
   ```

#### Linux/macOS

1. **安装 MySQL**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install mysql-server
   sudo systemctl start mysql
   sudo systemctl enable mysql
   
   # macOS (使用 Homebrew)
   brew install mysql
   brew services start mysql
   ```

2. **创建数据库**
   ```bash
   # 登录 MySQL
   mysql -u root -p
   
   # 创建数据库
   CREATE DATABASE api_automation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'your_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON api_automation.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **配置数据库连接**
   创建 `backend/.env` 文件：
   ```env
   DATABASE_URL=mysql+pymysql://your_user:your_password@localhost:3306/api_automation?charset=utf8mb4
   ```

### 方案 2: 使用 SQLite（开发环境，简单快速）

如果不想安装 MySQL，可以使用 SQLite 作为替代：

1. **修改数据库配置**
   
   编辑 `backend/core/config.py`：
   ```python
   DATABASE_URL: str = "sqlite:///./api_automation.db"
   ```

2. **安装 SQLite 支持**
   
   SQLite 是 Python 内置的，不需要额外安装驱动。

3. **运行数据库迁移**
   ```bash
   cd backend
   alembic upgrade head
   ```

## 运行数据库迁移

无论使用哪种数据库，都需要运行迁移来创建表结构：

```bash
cd backend
alembic upgrade head
```

如果还没有创建迁移文件，需要先初始化：

```bash
cd backend
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## 验证数据库连接

运行以下 Python 脚本测试连接：

```python
# test_db_connection.py
from core.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("数据库连接成功！")
except Exception as e:
    print(f"数据库连接失败: {e}")
```

## 常见问题

### 1. 端口被占用
如果 3306 端口被占用，可以：
- 修改 MySQL 配置使用其他端口
- 在 DATABASE_URL 中指定新端口

### 2. 认证失败
检查：
- 用户名和密码是否正确
- MySQL 用户是否有访问权限

### 3. 数据库不存在
确保已创建数据库：
```sql
CREATE DATABASE api_automation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 字符编码问题
MySQL 连接字符串必须包含 `charset=utf8mb4` 参数：
```
mysql+pymysql://user:password@localhost:3306/api_automation?charset=utf8mb4
```

### 5. 时区问题
如果遇到时区相关错误，可以在连接字符串中添加时区参数：
```
mysql+pymysql://user:password@localhost:3306/api_automation?charset=utf8mb4&time_zone=%2B08%3A00
```

## 推荐配置

### 开发环境
- 使用 SQLite（简单快速）
- 或使用 Docker 运行 MySQL

### 生产环境
- 使用 MySQL（性能好，功能全，广泛使用）

