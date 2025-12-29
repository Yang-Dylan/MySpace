"""
测试数据库连接脚本
"""
import sys
from core.database import engine
from sqlalchemy import text

def test_connection():
    """测试数据库连接"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ 数据库连接成功！")
            return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        print("\n请检查：")
        print("1. MySQL 服务是否正在运行")
        print("2. 数据库是否已创建（CREATE DATABASE api_automation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;）")
        print("3. DATABASE_URL 配置是否正确（格式：mysql+pymysql://user:password@localhost:3306/api_automation?charset=utf8mb4）")
        print("4. 用户名和密码是否正确")
        print("\n详细说明请查看 DATABASE_SETUP.md")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)

