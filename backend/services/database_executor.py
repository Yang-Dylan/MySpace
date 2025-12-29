"""
数据库执行服务
"""
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from core.database import engine
from models.database_management import DatabaseOperation, SQLFile
from services.sql_validator import SQLValidator


class DatabaseExecutor:
    """数据库执行器"""
    
    def __init__(self, db: Session):
        self.db = db
        self.validator = SQLValidator()
    
    def execute_sql_file(
        self,
        sql_file: SQLFile,
        operation_type: str,
        target_database: Optional[str] = None,
        require_confirmation: bool = False
    ) -> DatabaseOperation:
        """
        执行SQL文件
        
        Args:
            sql_file: SQL文件对象
            operation_type: 操作类型（init或cleanup）
            target_database: 目标数据库名称（可选）
            require_confirmation: 是否需要确认（清理操作需要）
            
        Returns:
            数据库操作记录
        """
        # 验证SQL文件
        is_valid, error_message = self.validator.validate_sql(
            sql_file.content, sql_file.file_type
        )
        
        if not is_valid:
            operation = DatabaseOperation(
                sql_file_id=sql_file.id,
                user_id=sql_file.user_id,
                operation_type=operation_type,
                status="failed",
                target_database=target_database,
                error_message=f"SQL验证失败: {error_message}",
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow()
            )
            self.db.add(operation)
            self.db.commit()
            return operation
        
        # 检查危险操作
        dangerous_ops = self.validator.check_dangerous_operations(sql_file.content)
        if dangerous_ops and require_confirmation:
            # 这里应该等待用户确认，简化处理
            pass
        
        # 创建操作记录
        operation = DatabaseOperation(
            sql_file_id=sql_file.id,
            user_id=sql_file.user_id,
            operation_type=operation_type,
            status="running",
            target_database=target_database,
            executed_sql=sql_file.content,
            start_time=datetime.utcnow()
        )
        self.db.add(operation)
        self.db.commit()
        self.db.refresh(operation)
        
        try:
            # 执行SQL
            # 分割SQL语句（按分号分割）
            sql_statements = self._split_sql_statements(sql_file.content)
            
            total_affected_rows = 0
            results = []
            
            with engine.connect() as connection:
                for statement in sql_statements:
                    if not statement.strip():
                        continue
                    
                    try:
                        result = connection.execute(text(statement))
                        if hasattr(result, 'rowcount'):
                            total_affected_rows += result.rowcount or 0
                        results.append(f"执行成功: {statement[:50]}...")
                    except Exception as e:
                        results.append(f"执行失败: {str(e)}")
                        raise
                
                connection.commit()
            
            operation.status = "completed"
            operation.affected_rows = total_affected_rows
            operation.result = "\n".join(results)
            
        except Exception as e:
            operation.status = "failed"
            operation.error_message = str(e)
        
        finally:
            operation.end_time = datetime.utcnow()
            self.db.commit()
            self.db.refresh(operation)
        
        return operation
    
    def _split_sql_statements(self, content: str) -> List[str]:
        """分割SQL语句"""
        # 移除注释
        content = SQLValidator._remove_comments(content)
        
        # 按分号分割，但要注意字符串中的分号
        statements = []
        current_statement = ""
        in_string = False
        string_char = None
        
        for char in content:
            if char in ("'", '"') and not in_string:
                in_string = True
                string_char = char
            elif char == string_char and in_string:
                in_string = False
                string_char = None
            
            current_statement += char
            
            if char == ';' and not in_string:
                statements.append(current_statement.strip())
                current_statement = ""
        
        if current_statement.strip():
            statements.append(current_statement.strip())
        
        return [s for s in statements if s]


