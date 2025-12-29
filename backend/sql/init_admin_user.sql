-- 初始化管理员用户
-- 注意：此 SQL 脚本仅用于演示，实际生产环境应使用 Python 脚本（带密码哈希）

-- 使用前请先运行 Python 脚本生成密码哈希：
-- python scripts/init_admin_user.py

-- 或者手动插入（需要先获取密码哈希值）
-- INSERT INTO users (username, email, hashed_password, is_active, is_superuser, created_at)
-- VALUES (
--     'admin',
--     'admin@example.com',
--     '$2b$12$...',  -- 这里需要替换为实际的 bcrypt 哈希值
--     TRUE,
--     TRUE,
--     NOW()
-- )
-- ON DUPLICATE KEY UPDATE username=username;

-- 推荐使用 Python 脚本执行，因为需要密码哈希

