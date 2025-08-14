-- 添加组织ID和限流相关字段的迁移脚本
-- 执行时间: 2025-08-14

USE `claudehub`;

-- 为 claude_accounts 表添加组织ID和限流相关字段
ALTER TABLE `claude_accounts` 
ADD COLUMN `rate_limit_reset_at` timestamp NULL DEFAULT NULL COMMENT '限流重置时间' AFTER `organization_id`,
ADD COLUMN `rate_limit_type` varchar(50) DEFAULT NULL COMMENT '限流类型(five_hour, free_messages等)' AFTER `rate_limit_reset_at`,
ADD COLUMN `rate_limit_cooldown_seconds` int(11) DEFAULT NULL COMMENT '限流冷却秒数' AFTER `rate_limit_type`;

-- 添加索引
ALTER TABLE `claude_accounts` 
ADD INDEX `idx_organization_id` (`organization_id`),
ADD INDEX `idx_rate_limit_reset` (`rate_limit_reset_at`);

-- 创建限流日志表
CREATE TABLE `claude_rate_limit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `account_id` bigint(20) unsigned DEFAULT NULL COMMENT '账户ID',
  `email` varchar(255) DEFAULT NULL COMMENT '账户邮箱',
  `organization_id` varchar(36) DEFAULT NULL COMMENT '组织ID',
  `url` text NOT NULL COMMENT '触发限流的URL',
  `limit_type` varchar(50) DEFAULT NULL COMMENT '限流类型',
  `resets_at` timestamp NULL DEFAULT NULL COMMENT '重置时间',
  `cooldown_seconds` int(11) DEFAULT NULL COMMENT '冷却秒数',
  `source` varchar(50) DEFAULT NULL COMMENT '数据来源',
  `raw_data` json DEFAULT NULL COMMENT '原始数据',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '检测时间',
  PRIMARY KEY (`id`),
  KEY `idx_account_id` (`account_id`),
  KEY `idx_email` (`email`),
  KEY `idx_organization_id` (`organization_id`),
  KEY `idx_limit_type` (`limit_type`),
  KEY `idx_resets_at` (`resets_at`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_rate_limit_logs_account` FOREIGN KEY (`account_id`) REFERENCES `claude_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='限流检测日志表';

-- 显示迁移结果
SELECT 'Migration completed successfully!' as message;
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'claudehub' 
  AND TABLE_NAME = 'claude_accounts' 
  AND COLUMN_NAME IN ('organization_id', 'rate_limit_reset_at', 'rate_limit_type', 'rate_limit_cooldown_seconds')
ORDER BY ORDINAL_POSITION;


-- 删除 rate_limit_type 字段
ALTER TABLE claude_accounts DROP COLUMN rate_limit_type;

-- 删除 rate_limit_cooldown_seconds 字段  
ALTER TABLE claude_accounts DROP COLUMN rate_limit_cooldown_seconds;

-- 查看修改后的表结构
DESCRIBE claude_accounts;


-- 将 organization_id 字段类型从 varchar(36) 改为 int(11)
ALTER TABLE claude_accounts MODIFY COLUMN organization_id int(11) DEFAULT NULL COMMENT 'Claude Organization ID';