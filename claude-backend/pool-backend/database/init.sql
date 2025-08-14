-- Claude Pool Manager 数据库初始化脚本
-- 创建数据库和表结构

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `claudehub` 
    DEFAULT CHARACTER SET = 'utf8mb4'
    DEFAULT COLLATE = 'utf8mb4_unicode_ci';

USE `claudehub`;

-- 1. 核心账户表
CREATE TABLE `claude_accounts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `email` varchar(255) NOT NULL COMMENT '邮箱地址',
  `session_key` text NOT NULL COMMENT 'Claude Session Key',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '账户状态：1=正常，0=禁用',
  `last_used_at` timestamp NULL DEFAULT NULL COMMENT '最后使用时间',
  `usage_count` int(11) NOT NULL DEFAULT 0 COMMENT '使用次数统计',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` varchar(100) DEFAULT 'admin' COMMENT '创建者',
  `notes` text DEFAULT NULL COMMENT '备注信息',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_last_used` (`last_used_at`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Claude账户信息表';

-- 2. 使用日志表
CREATE TABLE `claude_usage_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `account_id` bigint(20) unsigned NOT NULL COMMENT '账户ID',
  `email` varchar(255) NOT NULL COMMENT '使用的邮箱',
  `login_mode` enum('random','specific') NOT NULL COMMENT '登录模式',
  `unique_name` varchar(255) DEFAULT NULL COMMENT '唯一标识名',
  `expires_in` int(11) DEFAULT NULL COMMENT 'Token过期时间(秒)',
  `client_ip` varchar(45) DEFAULT NULL COMMENT '客户端IP',
  `user_agent` text DEFAULT NULL COMMENT '用户代理',
  `success` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否成功：1=成功，0=失败',
  `error_message` text DEFAULT NULL COMMENT '错误信息',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '使用时间',
  PRIMARY KEY (`id`),
  KEY `idx_account_id` (`account_id`),
  KEY `idx_email` (`email`),
  KEY `idx_login_mode` (`login_mode`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_success` (`success`),
  CONSTRAINT `fk_usage_logs_account` FOREIGN KEY (`account_id`) REFERENCES `claude_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Claude使用日志表';

-- 3. 管理员操作日志表
CREATE TABLE `claude_admin_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `action` enum('add','update','delete','batch','login') NOT NULL COMMENT '操作类型',
  `target_email` varchar(255) DEFAULT NULL COMMENT '目标邮箱',
  `old_data` json DEFAULT NULL COMMENT '操作前数据',
  `new_data` json DEFAULT NULL COMMENT '操作后数据',
  `admin_ip` varchar(45) DEFAULT NULL COMMENT '管理员IP',
  `user_agent` text DEFAULT NULL COMMENT '用户代理',
  `success` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否成功：1=成功，0=失败',
  `error_message` text DEFAULT NULL COMMENT '错误信息',
  `batch_id` varchar(50) DEFAULT NULL COMMENT '批量操作ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_action` (`action`),
  KEY `idx_target_email` (`target_email`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_batch_id` (`batch_id`),
  KEY `idx_success` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';

-- 4. 系统配置表
CREATE TABLE `claude_config` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text NOT NULL COMMENT '配置值',
  `config_type` enum('string','number','boolean','json') NOT NULL DEFAULT 'string' COMMENT '配置类型',
  `description` varchar(500) DEFAULT NULL COMMENT '配置描述',
  `is_encrypted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否加密：1=是，0=否',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 5. 统计汇总表
CREATE TABLE `claude_statistics` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `stat_date` date NOT NULL COMMENT '统计日期',
  `total_accounts` int(11) NOT NULL DEFAULT 0 COMMENT '总账户数',
  `active_accounts` int(11) NOT NULL DEFAULT 0 COMMENT '活跃账户数',
  `total_logins` int(11) NOT NULL DEFAULT 0 COMMENT '总登录次数',
  `random_logins` int(11) NOT NULL DEFAULT 0 COMMENT '随机登录次数',
  `specific_logins` int(11) NOT NULL DEFAULT 0 COMMENT '指定登录次数',
  `failed_logins` int(11) NOT NULL DEFAULT 0 COMMENT '失败登录次数',
  `admin_operations` int(11) NOT NULL DEFAULT 0 COMMENT '管理员操作次数',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stat_date` (`stat_date`),
  KEY `idx_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统计汇总表';

-- 插入默认配置
INSERT INTO `claude_config` (`config_key`, `config_value`, `config_type`, `description`) VALUES
('admin_password', 'admin123', 'string', '管理员密码'),
('base_url', 'https://claude.lqqmail.xyz', 'string', 'Claude API基础URL'),
('token_expires_in', '0', 'number', '默认Token过期时间(秒)，0表示不过期'),
('max_accounts', '1000', 'number', '最大账户数限制'),
('enable_usage_log', 'true', 'boolean', '是否启用使用日志'),
('enable_admin_log', 'true', 'boolean', '是否启用管理员日志'),
('auto_cleanup_days', '30', 'number', '日志自动清理天数');

-- 创建视图：账户统计
CREATE VIEW `v_account_stats` AS
SELECT 
    COUNT(*) as total_accounts,
    COUNT(CASE WHEN status = 1 THEN 1 END) as active_accounts,
    COUNT(CASE WHEN status = 0 THEN 1 END) as disabled_accounts,
    COUNT(CASE WHEN last_used_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recent_used_accounts,
    COALESCE(AVG(usage_count), 0) as avg_usage_count,
    MAX(last_used_at) as last_activity_time
FROM claude_accounts;

-- 创建视图：今日使用统计
CREATE VIEW `v_today_usage` AS
SELECT 
    COUNT(*) as total_logins,
    COUNT(CASE WHEN login_mode = 'random' THEN 1 END) as random_logins,
    COUNT(CASE WHEN login_mode = 'specific' THEN 1 END) as specific_logins,
    COUNT(CASE WHEN success = 0 THEN 1 END) as failed_logins,
    COUNT(DISTINCT email) as unique_accounts_used
FROM claude_usage_logs 
WHERE DATE(created_at) = CURDATE();

-- 插入示例数据（可选）
-- INSERT INTO `claude_accounts` (`email`, `session_key`, `status`, `created_by`) VALUES
-- ('example@gmail.com', 'sk-ant-session-example123456789', 1, 'admin'),
-- ('test@example.com', 'sk-ant-session-test987654321', 1, 'admin');

-- 显示创建结果
SELECT 'Database and tables created successfully!' as message;
SELECT TABLE_NAME, TABLE_COMMENT 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'claudehub' 
ORDER BY TABLE_NAME;


-- 添加账号状态字段
ALTER TABLE claude_accounts ADD COLUMN account_status ENUM('idle', 'available', 'busy') DEFAULT 'idle' COMMENT '账号状态: idle=空闲, available=可用, busy=繁忙' AFTER rate_limit_reset_at;

-- 添加索引
ALTER TABLE claude_accounts ADD INDEX idx_account_status (account_status);

-- 查看修改结果
DESCRIBE claude_accounts;