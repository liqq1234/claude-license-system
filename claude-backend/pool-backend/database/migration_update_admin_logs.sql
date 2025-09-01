-- 更新claude_admin_logs表的action枚举，添加plugin_add
-- 执行时间: 2024-01-01

USE `claudehub`;

-- 修改action字段的枚举值，添加plugin_add
ALTER TABLE `claude_admin_logs` 
MODIFY COLUMN `action` enum('add','update','delete','batch','login','plugin_add') NOT NULL COMMENT '操作类型';

-- 显示结果
SELECT 'Admin logs action enum updated successfully!' as message;

-- 显示当前表结构
DESCRIBE `claude_admin_logs`;
