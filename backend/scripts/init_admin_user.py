"""
初始化管理员用户脚本
创建默认的 admin 用户
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from core.database import SessionLocal
from models.user import User

def hash_password_direct(password: str) -> str:
    """直接使用 bcrypt 哈希密码（避免 passlib 兼容性问题）"""
    try:
        import bcrypt
        password_bytes = password.encode('utf-8')
        # bcrypt 限制密码长度不能超过 72 字节
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    except ImportError:
        # 如果 bcrypt 不可用，回退到 passlib
        from core.security import get_password_hash
        return get_password_hash(password)

def init_admin_user():
    """初始化管理员用户"""
    db = SessionLocal()
    
    try:
        # 检查是否已存在 admin 用户
        existing_user = db.query(User).filter(User.username == "admin").first()
        if existing_user:
            print("[WARNING] admin 用户已存在，跳过创建")
            print(f"   用户ID: {existing_user.id}")
            print(f"   邮箱: {existing_user.email}")
            return True
        
        # 创建 admin 用户
        hashed_password = hash_password_direct("123456")
        admin_user = User(
            username="admin",
            email="admin@example.com",
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("[SUCCESS] 管理员用户创建成功！")
        print(f"   用户名: admin")
        print(f"   密码: 123456")
        print(f"   邮箱: admin@example.com")
        print(f"   用户ID: {admin_user.id}")
        print(f"   超级管理员: 是")
        print(f"   状态: 激活")
        print("\n[WARNING] 请在生产环境中及时修改默认密码！")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] 创建管理员用户失败: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("开始创建管理员用户...")
    success = init_admin_user()
    sys.exit(0 if success else 1)

