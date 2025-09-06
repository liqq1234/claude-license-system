-- 添加新服务类型支持的数据库迁移脚本
-- 添加 Claude、Midjourney 和全能激活码支持

-- 1. 更新现有的 Midjourney 激活码记录（如果有的话）
UPDATE activation_codes SET service_type = 'midjourney' WHERE service_type = 'midjourney';

-- 2. 更新现有的用户激活记录
UPDATE user_activations SET service_type = 'midjourney' WHERE service_type = 'midjourney';

-- 3. 更新现有的激活批次记录
UPDATE activation_batches SET service_type = 'midjourney' WHERE service_type = 'midjourney';

-- 4. 更新token池记录
UPDATE token_pools SET service_type = 'midjourney' WHERE service_type = 'midjourney';

-- 5. 检查并显示支持的服务类型
SELECT 'Migration completed. Supported service types:' as message;
SELECT 'claude - Claude AI助手' as service_info
UNION ALL
SELECT 'midjourney - Midjourney AI绘图' as service_info
UNION ALL 
SELECT 'universal - 全能激活码（支持Claude和Midjourney）' as service_info
UNION ALL
SELECT 'gamma - Gamma设计工具（兼容保留）' as service_info
UNION ALL
SELECT 'figma - Figma设计工具（兼容保留）' as service_info
UNION ALL
SELECT 'canva - Canva设计平台（兼容保留）' as service_info
UNION ALL
SELECT 'premium - 高级会员（兼容保留）' as service_info;

-- 6. 创建索引以优化新服务类型查询
ALTER TABLE activation_codes 
ADD INDEX idx_service_type_status (service_type, status);

ALTER TABLE user_activations 
ADD INDEX idx_user_service_type (user_id, service_type, status);

ALTER TABLE activation_batches 
ADD INDEX idx_batch_service_type (service_type);

SELECT 'Database migration for new service types completed successfully!' as result;
