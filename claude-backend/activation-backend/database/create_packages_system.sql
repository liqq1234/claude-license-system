-- 套餐管理系统数据库设计
-- 创建时间: 2025-09-03
-- 用途: 支持图片中的购买界面套餐数据管理

USE license_server;

-- 1. 套餐类型表 (订阅类型: ChatGPT, Claude, ChatGPT & Claude)
DROP TABLE IF EXISTS `subscription_types`;
CREATE TABLE `subscription_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(50) NOT NULL COMMENT '套餐类型名称 (ChatGPT, Claude, ChatGPT & Claude)',
  `code` varchar(20) NOT NULL COMMENT '套餐代码 (chatgpt, claude, combo)',
  `description` text COMMENT '套餐描述',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用: 1=启用, 0=禁用',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序权重',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='套餐类型表';

-- 2. 套餐时长配置表 (1天, 3天, 7天, 14天, 30天, 60天, 90天, 365天)
DROP TABLE IF EXISTS `duration_options`;
CREATE TABLE `duration_options` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(20) NOT NULL COMMENT '时长名称 (1天, 3天, 7天等)',
  `days` int NOT NULL COMMENT '天数',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用: 1=启用, 0=禁用',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序权重',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_days` (`days`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='套餐时长配置表';

-- 3. 套餐产品表 (具体的套餐产品配置)
DROP TABLE IF EXISTS `packages`;
CREATE TABLE `packages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(100) NOT NULL COMMENT '套餐名称 (Claude pro/max 1天)',
  `subscription_type_id` int unsigned NOT NULL COMMENT '套餐类型ID',
  `duration_id` int unsigned NOT NULL COMMENT '时长ID',
  `price` decimal(10,2) NOT NULL COMMENT '价格 (元)',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '原价 (用于显示折扣)',
  `features` json DEFAULT NULL COMMENT '功能特性 (JSON格式存储)',
  `is_recommended` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否推荐: 1=推荐, 0=普通',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用: 1=启用, 0=禁用',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序权重',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type_duration` (`subscription_type_id`, `duration_id`),
  KEY `idx_subscription_type` (`subscription_type_id`),
  KEY `idx_duration` (`duration_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_is_recommended` (`is_recommended`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `fk_packages_subscription_type` FOREIGN KEY (`subscription_type_id`) REFERENCES `subscription_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_packages_duration` FOREIGN KEY (`duration_id`) REFERENCES `duration_options` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='套餐产品表';

-- 4. 支付方式表
DROP TABLE IF EXISTS `payment_methods`;
CREATE TABLE `payment_methods` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(50) NOT NULL COMMENT '支付方式名称 (支付宝支付, 微信支付等)',
  `code` varchar(20) NOT NULL COMMENT '支付方式代码 (alipay, wechat, bank)',
  `icon` varchar(255) DEFAULT NULL COMMENT '图标URL',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用: 1=启用, 0=禁用',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序权重',
  `config` json DEFAULT NULL COMMENT '支付配置信息 (JSON格式)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付方式表';

-- 5. 订单表 (用户购买记录)
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_no` varchar(32) NOT NULL COMMENT '订单号',
  `user_id` bigint unsigned DEFAULT NULL COMMENT '用户ID (可为空，支持游客购买)',
  `package_id` int unsigned NOT NULL COMMENT '套餐ID',
  `payment_method_id` int unsigned NOT NULL COMMENT '支付方式ID',
  `amount` decimal(10,2) NOT NULL COMMENT '支付金额',
  `status` enum('pending','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
  `payment_info` json DEFAULT NULL COMMENT '支付信息 (第三方订单号等)',
  `activation_code` varchar(100) DEFAULT NULL COMMENT '激活码 (支付成功后生成)',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '激活码过期时间',
  `used_at` timestamp NULL DEFAULT NULL COMMENT '激活码使用时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  UNIQUE KEY `uk_activation_code` (`activation_code`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_package_id` (`package_id`),
  KEY `idx_payment_method_id` (`payment_method_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_orders_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_payment_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 插入初始数据

-- 插入套餐类型
INSERT INTO `subscription_types` (`name`, `code`, `description`, `sort_order`) VALUES
('ChatGPT', 'chatgpt', 'ChatGPT订阅服务', 1),
('Claude', 'claude', 'Claude订阅服务', 2),
('ChatGPT & Claude', 'combo', 'ChatGPT和Claude组合套餐', 3);

-- 插入时长选项
INSERT INTO `duration_options` (`name`, `days`, `sort_order`) VALUES
('1天', 1, 1),
('3天', 3, 2),
('7天', 7, 3),
('14天', 14, 4),
('30天', 30, 5),
('60天', 60, 6),
('90天', 90, 7),
('365天', 365, 8);

-- 插入支付方式
INSERT INTO `payment_methods` (`name`, `code`, `icon`, `sort_order`) VALUES
('支付宝支付', 'alipay', '/images/payment/alipay.png', 1),
('微信支付', 'wechat', '/images/payment/wechat.png', 2),
('银行卡支付', 'bank', '/images/payment/bank.png', 3);

-- 插入示例套餐 (根据图片中的Claude套餐)
INSERT INTO `packages` (`name`, `subscription_type_id`, `duration_id`, `price`, `features`, `is_recommended`) VALUES
('Claude pro/max 1天', 2, 1, 3.80, 
'{"专属功能": ["高级功能", "Claude: 50次/3小时"], "服务保障": ["国内直连使用", "官网UI完整还原", "客服快速响应"]}', 
1);

-- 为其他时长创建套餐 (价格可以根据实际情况调整)
INSERT INTO `packages` (`name`, `subscription_type_id`, `duration_id`, `price`, `features`) VALUES
('Claude pro/max 3天', 2, 2, 10.80, 
'{"专属功能": ["高级功能", "Claude: 50次/3小时"], "服务保障": ["国内直连使用", "官网UI完整还原", "客服快速响应"]}'),
('Claude pro/max 7天', 2, 3, 24.80, 
'{"专属功能": ["高级功能", "Claude: 50次/3小时"], "服务保障": ["国内直连使用", "官网UI完整还原", "客服快速响应"]}'),
('Claude pro/max 14天', 2, 4, 48.80, 
'{"专属功能": ["高级功能", "Claude: 50次/3小时"], "服务保障": ["国内直连使用", "官网UI完整还原", "客服快速响应"]}'),
('Claude pro/max 30天', 2, 5, 98.80, 
'{"专属功能": ["高级功能", "Claude: 50次/3小时"], "服务保障": ["国内直连使用", "官网UI完整还原", "客服快速响应"]}'),
('Claude pro/max 60天', 2, 6, 188.80, 
'{"专属功能": ["高级功能", "Claude: 50次/3小时"], "服务保障": ["国内直连使用", "官网UI完整还原", "客服快速响应"]}'),
('Claude pro/max 90天', 2, 7, 268.80, 
'{"专属功能": ["高级功能", "Claude: 50次/3小时"], "服务保障": ["国内直连使用", "官网UI完整还原", "客服快速响应"]}'),
('Claude pro/max 365天', 2, 8, 998.80, 
'{"专属功能": ["高级功能", "Claude: 50次/3小时"], "服务保障": ["国内直连使用", "官网UI完整还原", "客服快速响应"]}');
