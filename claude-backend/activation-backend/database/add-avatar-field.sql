-- 为用户表添加avatar字段
-- 执行时间: 2025-01-06

-- 添加avatar字段到users表
ALTER TABLE users 
ADD COLUMN avatar VARCHAR(500) NULL COMMENT '用户头像URL' 
AFTER email;

-- 创建索引（可选，如果需要按头像查询）
-- CREATE INDEX idx_users_avatar ON users(avatar);

-- 验证字段是否添加成功
DESCRIBE users;

-- 为现有用户生成默认头像（可选）
-- 这里使用Gravatar作为默认头像服务
UPDATE users 
SET avatar = CONCAT(
    'https://www.gravatar.com/avatar/', 
    MD5(LOWER(TRIM(email))), 
    '?d=identicon&s=200'
) 
WHERE avatar IS NULL;

-- 显示更新结果
SELECT id, username, email, avatar FROM users LIMIT 10;
