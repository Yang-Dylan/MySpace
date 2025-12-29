"""
一键初始化脚本
创建数据库表和管理员用户
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

def init_all():
    """初始化数据库和默认用户"""
    print("=" * 50)
    print("开始初始化数据库...")
    print("=" * 50)
    
    # 1. 创建数据库表
    print("\n[1/2] 创建数据库表...")
    import importlib.util
    
    # 导入 init_database
    spec_db = importlib.util.spec_from_file_location(
        "init_database", 
        os.path.join(os.path.dirname(__file__), "init_database.py")
    )
    init_db_module = importlib.util.module_from_spec(spec_db)
    spec_db.loader.exec_module(init_db_module)
    
    if not init_db_module.init_database():
        print("[ERROR] 数据库表创建失败，终止初始化")
        return False
    
    # 2. 创建管理员用户
    print("\n[2/2] 创建管理员用户...")
    spec_admin = importlib.util.spec_from_file_location(
        "init_admin_user",
        os.path.join(os.path.dirname(__file__), "init_admin_user.py")
    )
    init_admin_module = importlib.util.module_from_spec(spec_admin)
    spec_admin.loader.exec_module(init_admin_module)
    
    if not init_admin_module.init_admin_user():
        print("[ERROR] 管理员用户创建失败")
        return False
    
    print("\n" + "=" * 50)
    print("[SUCCESS] 初始化完成！")
    print("=" * 50)
    print("\n默认管理员账号：")
    print("  用户名: admin")
    print("  密码: 123456")
    print("\n[WARNING] 请在生产环境中及时修改默认密码！")
    
    return True

if __name__ == "__main__":
    success = init_all()
    sys.exit(0 if success else 1)

