/**
 * 数据库迁移脚本：将ID字段改为雪花ID
 * 注意：此脚本会修改主键和外键，请在执行前备份数据库
 */

const { sequelize } = require('../src/config/database')
const { generateSnowflakeId } = require('../src/utils/snowflake')

async function migrateToSnowflakeIds() {
  const transaction = await sequelize.transaction()
  
  try {
    console.log('🚀 开始迁移数据库ID到雪花ID...')
    
    // 1. 创建ID映射表
    console.log('📝 创建ID映射表...')
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS id_mapping (
        table_name VARCHAR(50),
        old_id BIGINT,
        new_id BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_table_old_id (table_name, old_id),
        INDEX idx_table_new_id (table_name, new_id)
      )
    `, { transaction })
    
    // 2. 迁移用户表
    console.log('👤 迁移用户表...')
    
    // 2.1 获取所有用户
    const [users] = await sequelize.query('SELECT id, username, email FROM users ORDER BY id', { transaction })
    console.log(`找到 ${users.length} 个用户需要迁移`)
    
    if (users.length > 0) {
      // 2.2 添加新的雪花ID列
      await sequelize.query('ALTER TABLE users ADD COLUMN new_id BIGINT UNIQUE AFTER id', { transaction })
      
      // 2.3 为每个用户生成雪花ID
      const userIdMapping = new Map()
      for (const user of users) {
        const newId = generateSnowflakeId()
        await sequelize.query(
          'UPDATE users SET new_id = ? WHERE id = ?',
          { replacements: [newId, user.id], transaction }
        )
        
        // 记录映射关系
        await sequelize.query(
          'INSERT INTO id_mapping (table_name, old_id, new_id) VALUES (?, ?, ?)',
          { replacements: ['users', user.id, newId], transaction }
        )
        
        userIdMapping.set(user.id, newId)
        console.log(`✅ 用户 ${user.username} (${user.id} -> ${newId})`)
      }
      
      // 2.4 更新所有引用用户ID的表
      console.log('🔗 更新用户ID外键引用...')
      
      // 更新用户会话表
      const [sessions] = await sequelize.query('SELECT id, user_id FROM user_sessions', { transaction })
      if (sessions.length > 0) {
        await sequelize.query('ALTER TABLE user_sessions ADD COLUMN new_user_id BIGINT AFTER user_id', { transaction })
        for (const session of sessions) {
          const newUserId = userIdMapping.get(session.user_id)
          if (newUserId) {
            await sequelize.query(
              'UPDATE user_sessions SET new_user_id = ? WHERE id = ?',
              { replacements: [newUserId, session.id], transaction }
            )
          }
        }
      }
      
      // 更新操作日志表
      const [logs] = await sequelize.query('SELECT id, user_id FROM operation_logs', { transaction })
      if (logs.length > 0) {
        await sequelize.query('ALTER TABLE operation_logs ADD COLUMN new_user_id BIGINT AFTER user_id', { transaction })
        for (const log of logs) {
          const newUserId = userIdMapping.get(log.user_id)
          if (newUserId) {
            await sequelize.query(
              'UPDATE operation_logs SET new_user_id = ? WHERE id = ?',
              { replacements: [newUserId, log.id], transaction }
            )
          }
        }
      }
      
      // 更新用户激活码绑定表
      const [bindings] = await sequelize.query('SELECT id, user_id FROM user_activation_bindings', { transaction })
      if (bindings.length > 0) {
        await sequelize.query('ALTER TABLE user_activation_bindings ADD COLUMN new_user_id BIGINT AFTER user_id', { transaction })
        for (const binding of bindings) {
          const newUserId = userIdMapping.get(binding.user_id)
          if (newUserId) {
            await sequelize.query(
              'UPDATE user_activation_bindings SET new_user_id = ? WHERE id = ?',
              { replacements: [newUserId, binding.id], transaction }
            )
          }
        }
      }
      
      // 更新用户会员状态表
      const [memberships] = await sequelize.query('SELECT id, user_id FROM user_memberships', { transaction })
      if (memberships.length > 0) {
        await sequelize.query('ALTER TABLE user_memberships ADD COLUMN new_user_id BIGINT AFTER user_id', { transaction })
        for (const membership of memberships) {
          const newUserId = userIdMapping.get(membership.user_id)
          if (newUserId) {
            await sequelize.query(
              'UPDATE user_memberships SET new_user_id = ? WHERE id = ?',
              { replacements: [newUserId, membership.id], transaction }
            )
          }
        }
      }
      
      // 更新其他相关表...
      console.log('📊 更新其他表的用户ID引用...')
      
      // 检查并更新其他表
      const tablesToUpdate = [
        'activation_logs',
        'usage_records', 
        'proxy_sessions',
        'user_activations'
      ]
      
      for (const tableName of tablesToUpdate) {
        try {
          const [records] = await sequelize.query(`SELECT * FROM ${tableName} LIMIT 1`, { transaction })
          if (records.length > 0) {
            // 检查是否有user_id字段
            const columns = Object.keys(records[0])
            if (columns.includes('user_id')) {
              await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN new_user_id BIGINT AFTER user_id`, { transaction })
              
              const [allRecords] = await sequelize.query(`SELECT id, user_id FROM ${tableName}`, { transaction })
              for (const record of allRecords) {
                const newUserId = userIdMapping.get(record.user_id)
                if (newUserId) {
                  await sequelize.query(
                    `UPDATE ${tableName} SET new_user_id = ? WHERE id = ?`,
                    { replacements: [newUserId, record.id], transaction }
                  )
                }
              }
              console.log(`✅ 更新表 ${tableName} 完成`)
            }
          }
        } catch (error) {
          console.log(`⚠️  表 ${tableName} 不存在或无需更新: ${error.message}`)
        }
      }
    }
    
    console.log('🎉 数据迁移完成！')
    console.log('⚠️  请手动执行SQL脚本完成表结构调整')
    console.log('📄 SQL脚本位置: database/migrate-to-snowflake-ids.sql')
    
    await transaction.commit()
    
  } catch (error) {
    await transaction.rollback()
    console.error('❌ 迁移失败:', error)
    throw error
  }
}

// 执行迁移
if (require.main === module) {
  migrateToSnowflakeIds()
    .then(() => {
      console.log('✅ 迁移脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 迁移脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { migrateToSnowflakeIds }
