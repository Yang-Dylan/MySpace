# 修复 bcrypt 兼容性问题

## 问题描述

1. **bcrypt 版本兼容性错误**: `AttributeError: module 'bcrypt' has no attribute '__about__'`
   - 原因：passlib 1.7.4 与较新版本的 bcrypt 不兼容

2. **密码长度错误**: `password cannot be longer than 72 bytes`
   - 原因：bcrypt 限制密码长度不能超过 72 字节

## 解决方案

### 方案 1: 降级 bcrypt 版本（推荐）

```bash
cd backend
pip install bcrypt==4.0.1
```

或者更新 `requirements.txt` 后重新安装：

```bash
pip install -r requirements.txt --force-reinstall
```

### 方案 2: 使用修复后的脚本

使用 `init_admin_user.py`（已修复）或 `init_admin_user_fixed.py`：

```bash
cd backend
python scripts/init_admin_user.py
```

### 方案 3: 手动创建用户

如果脚本仍然失败，可以手动创建：

```python
# 在 Python 交互式环境中执行
from core.database import SessionLocal
from models.user import User
import bcrypt

db = SessionLocal()

# 哈希密码
password = "123456"
salt = bcrypt.gensalt(rounds=12)
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)

# 创建用户
admin = User(
    username="admin",
    email="admin@example.com",
    hashed_password=hashed.decode('utf-8'),
    is_active=True,
    is_superuser=True
)

db.add(admin)
db.commit()
print("管理员用户创建成功！")
```

## 验证修复

运行脚本后应该看到：

```
✅ 管理员用户创建成功！
   用户名: admin
   密码: 123456
   邮箱: admin@example.com
   用户ID: 1
   超级管理员: 是
   状态: 激活
```

## 注意事项

1. bcrypt 4.0.1 是最后一个与 passlib 1.7.4 完全兼容的版本
2. 如果使用更新的 bcrypt 版本，建议升级 passlib 到最新版本
3. 密码长度限制：bcrypt 最多支持 72 字节的密码

