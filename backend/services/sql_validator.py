"""
SQL文件验证服务
"""
import re
from typing import List, Tuple, Optional


class SQLValidator:
    """SQL验证器"""
    
    # 危险操作关键词
    DANGEROUS_KEYWORDS = [
        "DROP DATABASE",
        "DROP SCHEMA",
        "TRUNCATE",
        "DELETE FROM",
        "UPDATE",
        "ALTER TABLE",
        "DROP TABLE",
    ]
    
    # 允许的操作（用于初始化）
    ALLOWED_INIT_KEYWORDS = [
        "CREATE",
        "INSERT",
        "ALTER TABLE ADD",
        "ALTER TABLE MODIFY",
    ]
    
    # 允许的操作（用于清理）
    ALLOWED_CLEANUP_KEYWORDS = [
        "DELETE FROM",
        "TRUNCATE",
        "DROP TABLE",
    ]
    
    @staticmethod
    def validate_sql(content: str, file_type: str = "init") -> Tuple[bool, Optional[str]]:
        """
        验证SQL文件内容
        
        Args:
            content: SQL文件内容
            file_type: 文件类型（init或cleanup）
            
        Returns:
            (is_valid, error_message)
        """
        if not content or not content.strip():
            return False, "SQL文件内容不能为空"
        
        # 检查危险操作
        content_upper = content.upper()
        
        # 根据文件类型检查允许的操作
        if file_type == "init":
            # 初始化文件不允许删除操作
            for keyword in ["DROP DATABASE", "DROP SCHEMA", "TRUNCATE"]:
                if keyword in content_upper:
                    return False, f"初始化SQL文件不允许包含 {keyword} 操作"
        elif file_type == "cleanup":
            # 清理文件需要确认
            pass
        else:
            return False, f"未知的文件类型: {file_type}"
        
        # 检查SQL语法（简单检查）
        # 移除注释
        content_no_comments = SQLValidator._remove_comments(content)
        
        # 检查是否有基本的SQL语句结构
        if not re.search(r'\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE)\b', content_no_comments, re.IGNORECASE):
            return False, "SQL文件不包含有效的SQL语句"
        
        return True, None
    
    @staticmethod
    def _remove_comments(content: str) -> str:
        """移除SQL注释"""
        # 移除单行注释 --
        content = re.sub(r'--.*$', '', content, flags=re.MULTILINE)
        # 移除多行注释 /* */
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        return content
    
    @staticmethod
    def check_dangerous_operations(content: str) -> List[str]:
        """
        检查SQL中的危险操作
        
        Returns:
            危险操作列表
        """
        dangerous_ops = []
        content_upper = content.upper()
        
        for keyword in SQLValidator.DANGEROUS_KEYWORDS:
            if keyword in content_upper:
                dangerous_ops.append(keyword)
        
        return dangerous_ops


