-- 数据库迁移脚本：将ID字段改为雪花ID
-- 注意：此脚本会修改主键和外键，请在执行前备份数据库

-- 1. 创建临时表存储现有数据的映射关系
CREATE TABLE IF NOT EXISTS id_mapping (
    table_name VARCHAR(50),
    old_id BIGINT,
    new_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_old_id (table_name, old_id),
    INDEX idx_table_new_id (table_name, new_id)
);

-- 2. 修改用户表
-- 2.1 添加新的雪花ID列
ALTER TABLE users ADD COLUMN new_id BIGINT UNIQUE AFTER id;

-- 2.2 为现有用户生成雪花ID（这里需要在应用层执行）
-- UPDATE users SET new_id = ? WHERE id = ?;

-- 2.3 删除旧的主键约束
ALTER TABLE users DROP PRIMARY KEY;

-- 2.4 删除旧的id列
ALTER TABLE users DROP COLUMN id;

-- 2.5 重命名new_id为id
ALTER TABLE users CHANGE COLUMN new_id id BIGINT PRIMARY KEY;

-- 3. 修改邮箱验证码表
ALTER TABLE email_verification_codes ADD COLUMN new_id BIGINT UNIQUE AFTER id;
-- 生成雪花ID（应用层执行）
ALTER TABLE email_verification_codes DROP PRIMARY KEY;
ALTER TABLE email_verification_codes DROP COLUMN id;
ALTER TABLE email_verification_codes CHANGE COLUMN new_id id BIGINT PRIMARY KEY;

-- 4. 修改用户会话表
ALTER TABLE user_sessions ADD COLUMN new_id BIGINT UNIQUE AFTER id;
ALTER TABLE user_sessions ADD COLUMN new_user_id BIGINT AFTER user_id;
-- 更新外键引用（应用层执行）
ALTER TABLE user_sessions DROP PRIMARY KEY;
ALTER TABLE user_sessions DROP COLUMN id;
ALTER TABLE user_sessions DROP COLUMN user_id;
ALTER TABLE user_sessions CHANGE COLUMN new_id id BIGINT PRIMARY KEY;
ALTER TABLE user_sessions CHANGE COLUMN new_user_id user_id BIGINT;

-- 5. 修改操作日志表
ALTER TABLE operation_logs ADD COLUMN new_id BIGINT UNIQUE AFTER id;
ALTER TABLE operation_logs ADD COLUMN new_user_id BIGINT AFTER user_id;
-- 更新外键引用（应用层执行）
ALTER TABLE operation_logs DROP PRIMARY KEY;
ALTER TABLE operation_logs DROP COLUMN id;
ALTER TABLE operation_logs DROP COLUMN user_id;
ALTER TABLE operation_logs CHANGE COLUMN new_id id BIGINT PRIMARY KEY;
ALTER TABLE operation_logs CHANGE COLUMN new_user_id user_id BIGINT;

-- 6. 修改激活码表（保持INTEGER类型，因为数量相对较少）
-- 激活码表保持原有的INTEGER自增ID

-- 7. 修改用户激活码绑定表
ALTER TABLE user_activation_bindings ADD COLUMN new_id BIGINT UNIQUE AFTER id;
ALTER TABLE user_activation_bindings ADD COLUMN new_user_id BIGINT AFTER user_id;
-- 更新外键引用（应用层执行）
ALTER TABLE user_activation_bindings DROP PRIMARY KEY;
ALTER TABLE user_activation_bindings DROP COLUMN id;
ALTER TABLE user_activation_bindings DROP COLUMN user_id;
ALTER TABLE user_activation_bindings CHANGE COLUMN new_id id BIGINT PRIMARY KEY;
ALTER TABLE user_activation_bindings CHANGE COLUMN new_user_id user_id BIGINT;

-- 8. 修改用户会员状态表
ALTER TABLE user_memberships ADD COLUMN new_id BIGINT UNIQUE AFTER id;
ALTER TABLE user_memberships ADD COLUMN new_user_id BIGINT AFTER user_id;
-- 更新外键引用（应用层执行）
ALTER TABLE user_memberships DROP PRIMARY KEY;
ALTER TABLE user_memberships DROP COLUMN id;
ALTER TABLE user_memberships DROP COLUMN user_id;
ALTER TABLE user_memberships CHANGE COLUMN new_id id BIGINT PRIMARY KEY;
ALTER TABLE user_memberships CHANGE COLUMN new_user_id user_id BIGINT;

-- 9. 修改激活日志表
ALTER TABLE activation_logs ADD COLUMN new_id BIGINT UNIQUE AFTER id;
ALTER TABLE activation_logs ADD COLUMN new_user_id BIGINT AFTER user_id;
-- 更新外键引用（应用层执行）
ALTER TABLE activation_logs DROP PRIMARY KEY;
ALTER TABLE activation_logs DROP COLUMN id;
ALTER TABLE activation_logs DROP COLUMN user_id;
ALTER TABLE activation_logs CHANGE COLUMN new_id id BIGINT PRIMARY KEY;
ALTER TABLE activation_logs CHANGE COLUMN new_user_id user_id BIGINT;

-- 10. 修改使用记录表
ALTER TABLE usage_records ADD COLUMN new_user_id BIGINT AFTER user_id;
-- 更新外键引用（应用层执行）
ALTER TABLE usage_records DROP COLUMN user_id;
ALTER TABLE usage_records CHANGE COLUMN new_user_id user_id BIGINT;

-- 11. 修改代理会话表
ALTER TABLE proxy_sessions ADD COLUMN new_user_id BIGINT AFTER user_id;
-- 更新外键引用（应用层执行）
ALTER TABLE proxy_sessions DROP COLUMN user_id;
ALTER TABLE proxy_sessions CHANGE COLUMN new_user_id user_id BIGINT;

-- 12. 修改用户激活记录表
ALTER TABLE user_activations ADD COLUMN new_user_id BIGINT AFTER user_id;
-- 更新外键引用（应用层执行）
ALTER TABLE user_activations DROP COLUMN user_id;
ALTER TABLE user_activations CHANGE COLUMN new_user_id user_id BIGINT;

-- 13. 清理临时表（可选，用于调试时保留）
-- DROP TABLE id_mapping;
