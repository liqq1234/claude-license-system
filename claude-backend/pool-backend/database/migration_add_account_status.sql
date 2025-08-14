-- 添加账号状态字段的迁移脚本
-- 执行时间: 2025-08-14

USE `claudehub`;

-- 添加账号状态字段
ALTER TABLE `claude_accounts` 
ADD COLUMN `account_status` ENUM('idle', 'available', 'busy') DEFAULT 'idle' 
COMMENT '账号状态: idle=空闲, available=可用, busy=繁忙' 
AFTER `rate_limit_reset_at`;

-- 添加索引
ALTER TABLE `claude_accounts` 
ADD INDEX `idx_account_status` (`account_status`);

-- 将现有账户状态设置为可用
UPDATE `claude_accounts` SET `account_status` = 'available' WHERE `status` = 1;

-- 显示迁移结果
SELECT 'Account status migration completed successfully!' as message;

-- 查看新增字段
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'claudehub' 
  AND TABLE_NAME = 'claude_accounts' 
  AND COLUMN_NAME = 'account_status';

-- 查看状态分布
SELECT account_status, COUNT(*) as count 
FROM claude_accounts 
WHERE status = 1 
GROUP BY account_status;
