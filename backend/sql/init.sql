-- ============================================
-- API自动化测试平台数据库初始化脚本
-- ============================================
-- 数据库: api_automation
-- 字符集: utf8mb4
-- 
-- 设计原则：
-- 1. 所有表之间不使用外键约束（FOREIGN KEY）
-- 2. 使用索引（INDEX）优化查询性能
-- 3. 数据关联性由应用层维护
-- 4. 这样设计便于数据迁移和分布式部署
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS api_automation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE api_automation;

-- ============================================
-- 用户认证和权限相关表
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    resource VARCHAR(50) NOT NULL COMMENT '资源类型：test_case, api_doc等',
    action VARCHAR(50) NOT NULL COMMENT '操作：read, write, delete等'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 测试用例权限表
CREATE TABLE IF NOT EXISTS test_case_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    test_case_id INT NOT NULL,
    can_read BOOLEAN DEFAULT TRUE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_user_id (user_id),
    INDEX idx_test_case_id (test_case_id),
    UNIQUE KEY uk_user_test_case (user_id, test_case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- API文档管理相关表
-- ============================================

-- API分组表
CREATE TABLE IF NOT EXISTS api_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_user_id (user_id),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 分组数据集表
CREATE TABLE IF NOT EXISTS group_data_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data JSON COMMENT '数据集内容（JSON格式）',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_group_id (group_id),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API文档表
CREATE TABLE IF NOT EXISTS api_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) COMMENT '存储文件路径',
    format VARCHAR(50) COMMENT 'OpenAPI, Swagger等',
    content LONGTEXT COMMENT '文档内容（JSON/YAML）',
    user_id INT NOT NULL,
    group_id INT COMMENT '所属API分组ID',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_user_id (user_id),
    INDEX idx_group_id (group_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API表（从文档中解析出的API）
CREATE TABLE IF NOT EXISTS apis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    method VARCHAR(10) NOT NULL COMMENT 'GET, POST, PUT, DELETE等',
    path VARCHAR(500) NOT NULL,
    summary VARCHAR(255),
    description TEXT,
    request_schema TEXT COMMENT 'JSON Schema',
    response_schema TEXT COMMENT 'JSON Schema',
    tags JSON COMMENT 'API标签列表，如["token", "auth"]',
    is_available BOOLEAN DEFAULT TRUE COMMENT '是否可用（参数信息完整）',
    availability_reason TEXT COMMENT '不可用原因',
    parsed_request_params JSON COMMENT '解析后的请求参数列表',
    parsed_response_params JSON COMMENT '解析后的响应参数列表',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_document_id (document_id),
    INDEX idx_method (method),
    INDEX idx_path (path(255)),
    INDEX idx_is_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 测试用例相关表
-- ============================================

-- 测试用例表
CREATE TABLE IF NOT EXISTS test_cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INT NOT NULL,
    config JSON COMMENT '测试用例配置（JSON格式存储，包含API列表、执行顺序、字段映射等）',
    is_active BOOLEAN DEFAULT TRUE,
    data_set_id INT COMMENT '关联的数据集ID',
    data_set_field_mappings JSON COMMENT '数据集字段映射配置（JSON数组）',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_data_set_id (data_set_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 测试用例API配置表
CREATE TABLE IF NOT EXISTS test_case_apis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_case_id INT NOT NULL,
    api_id INT NOT NULL,
    `order` INT DEFAULT 0 COMMENT '执行顺序',
    retry_count INT DEFAULT 0 COMMENT '重试次数',
    retry_interval INT DEFAULT 0 COMMENT '重试间隔（秒）',
    wait_time INT DEFAULT 0 COMMENT '等待时间（秒）',
    field_mappings JSON COMMENT '字段映射配置（旧格式，保持兼容）',
    enhanced_field_mappings JSON COMMENT '增强的字段映射配置（新格式，支持数据集和API响应映射）',
    request_params JSON COMMENT 'API请求参数（JSON格式）',
    execution_condition JSON COMMENT '条件执行配置（JSON格式，包含conditions, logic, on_fail等）',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_test_case_id (test_case_id),
    INDEX idx_api_id (api_id),
    INDEX idx_order (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- API配置相关表
-- ============================================

-- API配置表（全局配置或模板）
CREATE TABLE IF NOT EXISTS api_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    api_id INT COMMENT '关联的API（可选，NULL表示全局模板）',
    user_id INT NOT NULL,
    retry_count INT DEFAULT 0 COMMENT '重试次数',
    retry_interval INT DEFAULT 0 COMMENT '重试间隔（秒）',
    retry_on_status JSON COMMENT '触发重试的HTTP状态码列表',
    wait_time INT DEFAULT 0 COMMENT '等待时间（秒）',
    wait_before BOOLEAN DEFAULT TRUE COMMENT '是否在API调用前等待',
    depends_on JSON COMMENT '依赖的API ID列表',
    field_mappings JSON COMMENT '字段映射：从依赖API提取字段并传递给当前API',
    timeout INT DEFAULT 30 COMMENT '请求超时时间（秒）',
    headers JSON COMMENT '自定义请求头',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_user_id (user_id),
    INDEX idx_api_id (api_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 测试执行相关表
-- ============================================

-- 测试执行记录表
CREATE TABLE IF NOT EXISTS test_executions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_case_id INT NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, running, completed, failed, cancelled',
    thread_count INT DEFAULT 1 COMMENT '使用的线程数',
    total_requests INT DEFAULT 0 COMMENT '总请求数',
    success_count INT DEFAULT 0 COMMENT '成功数',
    failure_count INT DEFAULT 0 COMMENT '失败数',
    start_time DATETIME(6),
    end_time DATETIME(6),
    duration FLOAT COMMENT '执行时长（秒）',
    error_message TEXT COMMENT '错误信息',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_test_case_id (test_case_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 测试执行结果表
CREATE TABLE IF NOT EXISTS test_execution_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    execution_id INT NOT NULL,
    api_id INT NOT NULL,
    `order` INT COMMENT '执行顺序',
    status VARCHAR(20) COMMENT 'success, failure, skipped',
    status_code INT COMMENT 'HTTP状态码',
    request_url VARCHAR(1000) COMMENT '请求URL',
    request_method VARCHAR(10) COMMENT '请求方法',
    request_headers JSON COMMENT '请求头',
    request_body TEXT COMMENT '请求体',
    response_headers JSON COMMENT '响应头',
    response_body TEXT COMMENT '响应体',
    response_time FLOAT COMMENT '响应时间（毫秒）',
    error_message TEXT COMMENT '错误信息',
    retry_count INT DEFAULT 0 COMMENT '重试次数',
    executed_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_execution_id (execution_id),
    INDEX idx_api_id (api_id),
    INDEX idx_status (status),
    INDEX idx_executed_at (executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 测试数据集表
CREATE TABLE IF NOT EXISTS test_data_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INT NOT NULL,
    data JSON COMMENT '数据集内容（JSON数组，每个元素是一条测试数据）',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 数据库管理相关表
-- ============================================

-- SQL文件表
CREATE TABLE IF NOT EXISTS sql_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL COMMENT 'SQL文件内容',
    file_type VARCHAR(20) DEFAULT 'init' COMMENT 'init: 初始化, cleanup: 清理',
    user_id INT NOT NULL,
    is_validated BOOLEAN DEFAULT FALSE COMMENT '是否已验证',
    validation_error TEXT COMMENT '验证错误信息',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_user_id (user_id),
    INDEX idx_file_type (file_type),
    INDEX idx_is_validated (is_validated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 数据库操作记录表
CREATE TABLE IF NOT EXISTS database_operations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sql_file_id INT NOT NULL,
    user_id INT NOT NULL,
    operation_type VARCHAR(20) COMMENT 'init: 初始化, cleanup: 清理',
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, running, completed, failed',
    target_database VARCHAR(100) COMMENT '目标数据库名称',
    executed_sql TEXT COMMENT '实际执行的SQL',
    result TEXT COMMENT '执行结果',
    error_message TEXT COMMENT '错误信息',
    affected_rows INT COMMENT '影响的行数',
    start_time DATETIME(6),
    end_time DATETIME(6),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_sql_file_id (sql_file_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 可视化编排相关表
-- ============================================

-- 编排流程表
CREATE TABLE IF NOT EXISTS orchestration_flows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INT NOT NULL,
    flow_data JSON NOT NULL COMMENT '编排流程数据（JSON格式，包含nodes和edges）',
    test_case_id INT COMMENT '关联的测试用例ID（可选）',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_user_id (user_id),
    INDEX idx_test_case_id (test_case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 字段映射表（用于存储API之间的字段关联关系）
CREATE TABLE IF NOT EXISTS field_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flow_id INT NOT NULL,
    source_node_id VARCHAR(100) NOT NULL COMMENT '源API节点ID（在flow_data中的节点ID）',
    target_node_id VARCHAR(100) NOT NULL COMMENT '目标API节点ID',
    source_field_path VARCHAR(500) NOT NULL COMMENT '源字段路径（JSON路径，如 "data.user.id"）',
    target_field_path VARCHAR(500) NOT NULL COMMENT '目标字段路径（JSON路径）',
    mapping_type VARCHAR(50) DEFAULT 'request_param' COMMENT '映射类型（request_param, request_header, request_body等）',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_flow_id (flow_id),
    INDEX idx_source_node_id (source_node_id),
    INDEX idx_target_node_id (target_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 初始化数据（可选）
-- ============================================

-- 插入默认角色（如果需要）
-- INSERT INTO roles (name, description) VALUES 
--     ('admin', '管理员'),
--     ('user', '普通用户')
-- ON DUPLICATE KEY UPDATE name=name;

-- 插入默认权限（如果需要）
-- INSERT INTO permissions (name, description, resource, action) VALUES
--     ('read_test_case', '读取测试用例', 'test_case', 'read'),
--     ('write_test_case', '写入测试用例', 'test_case', 'write'),
--     ('delete_test_case', '删除测试用例', 'test_case', 'delete')
-- ON DUPLICATE KEY UPDATE name=name;
    
