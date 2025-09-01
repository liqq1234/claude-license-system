-- =====================================================
-- 激活码数据同步触发器
-- 确保 activation_codes 和 user_activation_bindings 表数据同步
-- =====================================================

USE license_server;

-- 删除已存在的触发器（如果有）
DROP TRIGGER IF EXISTS sync_activation_code_update;
DROP TRIGGER IF EXISTS sync_activation_code_insert;

-- 设置分隔符，避免触发器内的分号被误解析
DELIMITER $$

-- =====================================================
-- 触发器1: 当 activation_codes 表更新时同步到 user_activation_bindings
-- =====================================================
CREATE TRIGGER sync_activation_code_update
    AFTER UPDATE ON activation_codes
    FOR EACH ROW
BEGIN
    -- 只有当关键字段发生变化时才同步
    IF (OLD.status != NEW.status 
        OR OLD.activated_at != NEW.activated_at 
        OR OLD.expires_at != NEW.expires_at
        OR OLD.used_count != NEW.used_count) THEN
        
        -- 同步更新所有相关的用户绑定记录
        UPDATE user_activation_bindings
        SET
            activated_at = NEW.activated_at,
            expires_at = NEW.expires_at,
            status = CASE
                WHEN NEW.status = 'used' THEN 'active'
                WHEN NEW.status = 'expired' THEN 'expired'
                WHEN NEW.status = 'revoked' THEN 'revoked'
                ELSE 'active'
            END
        WHERE activation_code_id = NEW.id;
        
        -- 记录同步日志（可选）
        INSERT INTO operation_logs (
            user_id,
            operation_type,
            operation_desc,
            ip_address,
            created_at
        )
        SELECT 
            uab.user_id,
            'activation_sync',
            CONCAT('激活码同步更新: ', NEW.code, ' -> ', NEW.status),
            '127.0.0.1',
            NOW()
        FROM user_activation_bindings uab
        WHERE uab.activation_code_id = NEW.id
        LIMIT 1;
        
    END IF;
END$$

-- =====================================================
-- 触发器2: 当 activation_codes 表插入时的处理（预留）
-- =====================================================
CREATE TRIGGER sync_activation_code_insert
    AFTER INSERT ON activation_codes
    FOR EACH ROW
BEGIN
    -- 记录激活码创建日志
    IF NEW.status = 'unused' THEN
        INSERT INTO operation_logs (
            user_id,
            operation_type,
            operation_desc,
            ip_address,
            created_at
        ) VALUES (
            NULL,
            'activation_create',
            CONCAT('激活码创建: ', NEW.code, ' (', NEW.type, ', ', NEW.duration, '小时)'),
            '127.0.0.1',
            NOW()
        );
    END IF;
END$$

-- =====================================================
-- 触发器3: 防止 user_activation_bindings 表的不一致更新
-- =====================================================
CREATE TRIGGER prevent_binding_inconsistency
    BEFORE UPDATE ON user_activation_bindings
    FOR EACH ROW
BEGIN
    DECLARE code_activated_at DATETIME;
    DECLARE code_expires_at DATETIME;
    DECLARE code_status VARCHAR(20);
    
    -- 获取激活码主表的最新数据
    SELECT activated_at, expires_at, status 
    INTO code_activated_at, code_expires_at, code_status
    FROM activation_codes 
    WHERE id = NEW.activation_code_id;
    
    -- 如果主表有数据，强制使用主表的时间
    IF code_activated_at IS NOT NULL THEN
        SET NEW.activated_at = code_activated_at;
    END IF;
    
    IF code_expires_at IS NOT NULL THEN
        SET NEW.expires_at = code_expires_at;
    END IF;
    
    -- 同步状态
    IF code_status IS NOT NULL THEN
        SET NEW.status = CASE 
            WHEN code_status = 'used' THEN 'active'
            WHEN code_status = 'expired' THEN 'expired'
            WHEN code_status = 'revoked' THEN 'revoked'
            ELSE NEW.status
        END;
    END IF;
    
    -- 注释：user_activation_bindings 表没有 updated_at 字段
END$$

-- 恢复默认分隔符
DELIMITER ;

-- =====================================================
-- 创建同步修复存储过程
-- =====================================================
DELIMITER $$

CREATE PROCEDURE FixActivationCodeSync()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_code_id INT;
    DECLARE v_activated_at DATETIME;
    DECLARE v_expires_at DATETIME;
    DECLARE v_status VARCHAR(20);
    
    -- 声明游标
    DECLARE code_cursor CURSOR FOR 
        SELECT id, activated_at, expires_at, status 
        FROM activation_codes 
        WHERE status != 'unused';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- 开始修复
    OPEN code_cursor;
    
    read_loop: LOOP
        FETCH code_cursor INTO v_code_id, v_activated_at, v_expires_at, v_status;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 同步更新绑定表
        UPDATE user_activation_bindings 
        SET 
            activated_at = v_activated_at,
            expires_at = v_expires_at,
            status = CASE
                WHEN v_status = 'used' THEN 'active'
                WHEN v_status = 'expired' THEN 'expired'
                WHEN v_status = 'revoked' THEN 'revoked'
                ELSE 'active'
            END
        WHERE activation_code_id = v_code_id;
        
    END LOOP;
    
    CLOSE code_cursor;
    
    SELECT 'Activation code sync fixed successfully' AS result;
END$$

DELIMITER ;

-- =====================================================
-- 查看触发器状态的视图
-- =====================================================
CREATE OR REPLACE VIEW activation_sync_status AS
SELECT 
    ac.id as code_id,
    ac.code,
    ac.status as code_status,
    ac.activated_at as code_activated_at,
    ac.expires_at as code_expires_at,
    uab.id as binding_id,
    uab.user_id,
    uab.status as binding_status,
    uab.activated_at as binding_activated_at,
    uab.expires_at as binding_expires_at,
    CASE 
        WHEN ac.activated_at = uab.activated_at 
         AND ac.expires_at = uab.expires_at THEN 'SYNCED'
        ELSE 'OUT_OF_SYNC'
    END as sync_status
FROM activation_codes ac
LEFT JOIN user_activation_bindings uab ON ac.id = uab.activation_code_id
WHERE ac.status != 'unused'
ORDER BY ac.id DESC;

-- 显示创建结果
SELECT 'Triggers and procedures created successfully!' as status;
SHOW TRIGGERS LIKE 'sync_%';
