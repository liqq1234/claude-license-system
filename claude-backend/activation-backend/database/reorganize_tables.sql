-- ====================================================================
-- 数据库表结构逻辑分区重组
-- 创建时间: 2025-09-03
-- 目的: 按功能模块重新组织表结构，提高可读性和维护性
-- ====================================================================

USE license_server;

-- ====================================================================
-- 1. 激活码管理模块 (LICENSE_)
-- ====================================================================

-- 1.1 激活码批次表 (重命名)
RENAME TABLE activation_batches TO license_activation_batches;

-- 1.2 激活码主表 (重命名)
RENAME TABLE activation_codes TO license_activation_codes;

-- 1.3 激活日志表 (重命名)
RENAME TABLE activation_logs TO license_activation_logs;

-- 1.4 设备绑定表 (重命名)
RENAME TABLE device_bindings TO license_device_bindings;

-- 1.5 用户激活绑定表 (重命名)
RENAME TABLE user_activation_bindings TO license_user_bindings;

-- 1.6 使用记录表 (重命名)
RENAME TABLE usage_records TO license_usage_records;

-- ====================================================================
-- 2. 套餐管理模块 (PACKAGE_)
-- ====================================================================

-- 2.1 套餐类型表 (重命名)
RENAME TABLE subscription_types TO package_subscription_types;

-- 2.2 套餐时长配置表 (重命名)
RENAME TABLE duration_options TO package_duration_options;

-- 2.3 套餐产品表 (重命名)
RENAME TABLE packages TO package_products;

-- ====================================================================
-- 3. 支付管理模块 (PAYMENT_)
-- ====================================================================

-- 3.1 支付方式表 (重命名)
RENAME TABLE payment_methods TO payment_methods;

-- 3.2 订单表 (重命名)
RENAME TABLE orders TO payment_orders;

-- ====================================================================
-- 4. 系统管理模块 (SYSTEM_)
-- ====================================================================

-- 4.1 API调用日志表 (重命名)
RENAME TABLE api_logs TO system_api_logs;

-- 4.2 操作日志表 (重命名)
RENAME TABLE operation_logs TO system_operation_logs;

-- 4.3 代理会话表 (重命名)
RENAME TABLE proxy_sessions TO system_proxy_sessions;

-- 4.4 令牌池表 (重命名)
RENAME TABLE token_pool TO system_token_pool;

-- ====================================================================
-- 5. 用户管理模块 (USER_)
-- ====================================================================

-- 5.1 邮箱验证码表 (重命名)
RENAME TABLE email_verification_codes TO user_email_verification_codes;

-- ====================================================================
-- 更新外键约束 (如果存在的话，需要重新创建)
-- ====================================================================

-- 注意：由于表名发生变化，所有外键约束需要重新创建
-- 这里只是示例，实际需要根据具体的外键关系来调整

-- 例如：套餐产品表的外键约束更新
-- ALTER TABLE package_products 
-- DROP FOREIGN KEY fk_packages_subscription_type,
-- DROP FOREIGN KEY fk_packages_duration;

-- ALTER TABLE package_products 
-- ADD CONSTRAINT fk_package_products_subscription_type 
--     FOREIGN KEY (subscription_type_id) REFERENCES package_subscription_types(id) 
--     ON DELETE CASCADE ON UPDATE CASCADE,
-- ADD CONSTRAINT fk_package_products_duration 
--     FOREIGN KEY (duration_id) REFERENCES package_duration_options(id) 
--     ON DELETE CASCADE ON UPDATE CASCADE;

-- ====================================================================
-- 创建视图以保持向后兼容性 (可选)
-- ====================================================================

-- 为了不影响现有代码，可以创建视图映射到旧表名
CREATE VIEW activation_codes AS SELECT * FROM license_activation_codes;
CREATE VIEW packages AS SELECT * FROM package_products;
CREATE VIEW orders AS SELECT * FROM payment_orders;
CREATE VIEW subscription_types AS SELECT * FROM package_subscription_types;
CREATE VIEW duration_options AS SELECT * FROM package_duration_options;

-- ====================================================================
-- 表结构说明文档
-- ====================================================================

/*
逻辑分区后的表结构组织：

📋 1. 激活码管理模块 (LICENSE_)
   - license_activation_batches     激活码批次表
   - license_activation_codes       激活码主表
   - license_activation_logs        激活日志表
   - license_device_bindings        设备绑定表
   - license_user_bindings          用户激活绑定表
   - license_usage_records          使用记录表

📦 2. 套餐管理模块 (PACKAGE_)
   - package_subscription_types     套餐类型表
   - package_duration_options       套餐时长配置表
   - package_products               套餐产品表

💰 3. 支付管理模块 (PAYMENT_)
   - payment_methods                支付方式表
   - payment_orders                 订单表

⚙️ 4. 系统管理模块 (SYSTEM_)
   - system_api_logs                API调用日志表
   - system_operation_logs          操作日志表
   - system_proxy_sessions          代理会话表
   - system_token_pool              令牌池表

👤 5. 用户管理模块 (USER_)
   - user_email_verification_codes  邮箱验证码表

优势：
- 表名直观，一眼就能看出属于哪个功能模块
- 便于权限管理和数据备份
- 利于团队协作和代码维护
- 支持模块化开发和测试
*/
