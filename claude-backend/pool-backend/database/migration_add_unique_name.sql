-- 添加unique_name字段到claude_accounts表
-- 执行时间: 2024-01-01

USE `claudehub`;

-- 检查字段是否已存在
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'claudehub'
    AND TABLE_NAME = 'claude_accounts'
    AND COLUMN_NAME = 'unique_name'
);

-- 如果字段不存在，则添加
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE `claude_accounts` ADD COLUMN `unique_name` varchar(255) DEFAULT NULL COMMENT ''唯一标识名'' AFTER `notes`',
    'SELECT ''Column unique_name already exists'' as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 为现有账户生成unique_name（使用邮箱前缀）
UPDATE `claude_accounts` 
SET `unique_name` = SUBSTRING_INDEX(email, '@', 1)
WHERE `unique_name` IS NULL;

-- 添加索引
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'claudehub'
    AND TABLE_NAME = 'claude_accounts'
    AND INDEX_NAME = 'idx_unique_name'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE `claude_accounts` ADD INDEX `idx_unique_name` (`unique_name`)',
    'SELECT ''Index idx_unique_name already exists'' as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 显示结果
SELECT 'Migration completed successfully!' as message;
SELECT email, unique_name FROM claude_accounts LIMIT 5;
