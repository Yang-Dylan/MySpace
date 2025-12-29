"""
数据库初始化脚本
使用 SQLAlchemy 创建所有表，并可选创建管理员用户

注意：本项目数据库设计不使用外键约束，数据关联性由应用层维护。
这样设计便于数据迁移和分布式部署。
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from core.database import Base, engine
# 导入所有模型以确保它们被注册
from models import user, api_doc, test_case, api_config, test_execution, database_management, orchestration

def init_database(create_admin=False):
    """初始化数据库，创建所有表"""
    print("开始创建数据库表...")
    print("注意：本项目不使用外键约束，数据关联由应用层维护")
    
    try:
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        print("[SUCCESS] 数据库表创建成功！")
        print("\n已创建的表：")
        print("  用户认证和权限：")
        print("    - users (用户表)")
        print("    - roles (角色表)")
        print("    - permissions (权限表)")
        print("    - test_case_permissions (测试用例权限表)")
        print("  API文档管理：")
        print("    - api_groups (API分组表)")
        print("    - api_documents (API文档表)")
        print("    - apis (API表)")
        print("  测试用例：")
        print("    - test_cases (测试用例表)")
        print("    - test_case_apis (测试用例API配置表)")
        print("  API配置：")
        print("    - api_configs (API配置表)")
        print("  测试执行：")
        print("    - test_executions (测试执行记录表)")
        print("    - test_execution_results (测试执行结果表)")
        print("    - test_data_sets (测试数据集表)")
        print("  数据库管理：")
        print("    - sql_files (SQL文件表)")
        print("    - database_operations (数据库操作记录表)")
        print("  可视化编排：")
        print("    - orchestration_flows (编排流程表)")
        print("    - field_mappings (字段映射表)")
        
        # 如果需要，创建管理员用户
        if create_admin:
            print("\n开始创建管理员用户...")
            import importlib.util
            spec = importlib.util.spec_from_file_location("init_admin_user", 
                os.path.join(os.path.dirname(__file__), "init_admin_user.py"))
            init_admin_user_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(init_admin_user_module)
            init_admin_user_module.init_admin_user()
        
        return True
    except Exception as e:
        print(f"[ERROR] 数据库表创建失败: {e}")
        return False

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='初始化数据库')
    parser.add_argument('--admin', action='store_true', help='同时创建管理员用户')
    args = parser.parse_args()
    
    success = init_database(create_admin=args.admin)
    sys.exit(0 if success else 1)

