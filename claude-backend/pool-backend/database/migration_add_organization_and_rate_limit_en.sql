-- Add organization ID and rate limit related fields migration script
-- Execution time: 2025-08-14

USE `claudehub`;

-- Add organization ID and rate limit related fields to claude_accounts table
ALTER TABLE `claude_accounts` 
ADD COLUMN `organization_id` varchar(36) DEFAULT NULL COMMENT 'Claude Organization ID' AFTER `notes`,
ADD COLUMN `rate_limit_reset_at` timestamp NULL DEFAULT NULL COMMENT 'Rate limit reset time' AFTER `organization_id`,
ADD COLUMN `rate_limit_type` varchar(50) DEFAULT NULL COMMENT 'Rate limit type' AFTER `rate_limit_reset_at`,
ADD COLUMN `rate_limit_cooldown_seconds` int(11) DEFAULT NULL COMMENT 'Rate limit cooldown seconds' AFTER `rate_limit_type`;

-- Add indexes
ALTER TABLE `claude_accounts` 
ADD INDEX `idx_organization_id` (`organization_id`),
ADD INDEX `idx_rate_limit_reset` (`rate_limit_reset_at`);

-- Create rate limit logs table
CREATE TABLE `claude_rate_limit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key ID',
  `account_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Account ID',
  `email` varchar(255) DEFAULT NULL COMMENT 'Account email',
  `organization_id` varchar(36) DEFAULT NULL COMMENT 'Organization ID',
  `url` text NOT NULL COMMENT 'URL that triggered rate limit',
  `limit_type` varchar(50) DEFAULT NULL COMMENT 'Rate limit type',
  `resets_at` timestamp NULL DEFAULT NULL COMMENT 'Reset time',
  `cooldown_seconds` int(11) DEFAULT NULL COMMENT 'Cooldown seconds',
  `source` varchar(50) DEFAULT NULL COMMENT 'Data source',
  `raw_data` json DEFAULT NULL COMMENT 'Raw data',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Detection time',
  PRIMARY KEY (`id`),
  KEY `idx_account_id` (`account_id`),
  KEY `idx_email` (`email`),
  KEY `idx_organization_id` (`organization_id`),
  KEY `idx_limit_type` (`limit_type`),
  KEY `idx_resets_at` (`resets_at`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_rate_limit_logs_account` FOREIGN KEY (`account_id`) REFERENCES `claude_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Rate limit detection logs table';

-- Show migration results
SELECT 'Migration completed successfully!' as message;
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'claudehub' 
  AND TABLE_NAME = 'claude_accounts' 
  AND COLUMN_NAME IN ('organization_id', 'rate_limit_reset_at', 'rate_limit_type', 'rate_limit_cooldown_seconds')
ORDER BY ORDINAL_POSITION;
