/**
 * 修复数据库问题脚本
 */

const { sequelize } = require('../src/models')
const logger = require('../src/utils/logger')

async function fixDatabase() {
  try {
    logger.info('🔧 开始修复数据库问题...')

    // 1. 检查activation_logs表的action字段数据
    const [results] = await sequelize.query(`
      SELECT DISTINCT action FROM activation_logs;
    `)
    
    logger.info('当前action字段的值:', results)

    // 2. 清理不兼容的数据或更新为兼容的值
    if (results.length > 0) {
      logger.info('清理activation_logs表中不兼容的数据...')
      
      // 将不兼容的action值更新为'activate'
      await sequelize.query(`
        UPDATE activation_logs 
        SET action = 'activate' 
        WHERE action NOT IN ('activate', 'validate', 'revoke', 'suspend', 'resume');
      `)
    }

    // 3. 检查其他可能有问题的枚举字段
    const tables = [
      {
        table: 'users',
        field: 'status',
        validValues: [0, 1], // 数字枚举
        defaultValue: 1
      },
      {
        table: 'activation_codes',
        field: 'status',
        validValues: ['unused', 'active', 'used', 'expired', 'suspended', 'disabled'],
        defaultValue: 'unused'
      },
      {
        table: 'activation_batches',
        field: 'status',
        validValues: ['active', 'completed', 'cancelled'],
        defaultValue: 'active'
      }
    ]

    for (const tableInfo of tables) {
      try {
        const [tableResults] = await sequelize.query(`
          SELECT DISTINCT ${tableInfo.field} FROM ${tableInfo.table};
        `)
        
        logger.info(`${tableInfo.table}.${tableInfo.field} 的值:`, tableResults)
        
        // 如果有不兼容的值，更新为默认值
        if (typeof tableInfo.validValues[0] === 'string') {
          const validValuesStr = tableInfo.validValues.map(v => `'${v}'`).join(', ')
          await sequelize.query(`
            UPDATE ${tableInfo.table} 
            SET ${tableInfo.field} = '${tableInfo.defaultValue}' 
            WHERE ${tableInfo.field} NOT IN (${validValuesStr});
          `)
        }
      } catch (error) {
        logger.warn(`检查表 ${tableInfo.table} 时出错:`, error.message)
      }
    }

    // 4. 删除可能存在的外键约束冲突
    try {
      await sequelize.query(`SET FOREIGN_KEY_CHECKS = 0;`)
      logger.info('已禁用外键检查')
    } catch (error) {
      logger.warn('禁用外键检查失败:', error.message)
    }

    logger.info('✅ 数据库问题修复完成')
    
  } catch (error) {
    logger.error('❌ 修复数据库失败:', error)
    throw error
  }
}

async function cleanupOldData() {
  try {
    logger.info('🧹 清理旧数据...')
    
    // 清理可能导致问题的旧数据
    const cleanupQueries = [
      // 清理过期的验证码
      `DELETE FROM email_verification_codes WHERE expires_at < NOW() - INTERVAL 7 DAY;`,
      
      // 清理过期的会话
      `DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL 7 DAY;`,
      
      // 清理旧的操作日志
      `DELETE FROM operation_logs WHERE created_at < NOW() - INTERVAL 30 DAY;`,
      
      // 清理旧的激活日志
      `DELETE FROM activation_logs WHERE created_at < NOW() - INTERVAL 30 DAY;`
    ]
    
    for (const query of cleanupQueries) {
      try {
        const [results] = await sequelize.query(query)
        logger.info(`执行清理查询: ${query.split(' ')[2]} - 影响行数: ${results.affectedRows || 0}`)
      } catch (error) {
        logger.warn(`清理查询失败: ${query}`, error.message)
      }
    }
    
    logger.info('✅ 旧数据清理完成')
    
  } catch (error) {
    logger.error('❌ 清理旧数据失败:', error)
  }
}

async function resetDatabase() {
  try {
    logger.info('🔄 重置数据库...')
    
    // 重新启用外键检查
    await sequelize.query(`SET FOREIGN_KEY_CHECKS = 1;`)
    
    // 同步数据库结构
    await sequelize.sync({ alter: true })
    
    logger.info('✅ 数据库重置完成')
    
  } catch (error) {
    logger.error('❌ 重置数据库失败:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const command = process.argv[2] || 'fix'
  
  switch (command) {
    case 'fix':
      fixDatabase()
        .then(() => resetDatabase())
        .then(() => {
          logger.info('🎉 数据库修复完成')
          process.exit(0)
        })
        .catch((error) => {
          logger.error('❌ 数据库修复失败:', error)
          process.exit(1)
        })
      break
      
    case 'cleanup':
      cleanupOldData()
        .then(() => {
          logger.info('🎉 数据清理完成')
          process.exit(0)
        })
        .catch((error) => {
          logger.error('❌ 数据清理失败:', error)
          process.exit(1)
        })
      break
      
    case 'reset':
      resetDatabase()
        .then(() => {
          logger.info('🎉 数据库重置完成')
          process.exit(0)
        })
        .catch((error) => {
          logger.error('❌ 数据库重置失败:', error)
          process.exit(1)
        })
      break
      
    default:
      logger.error('未知命令:', command)
      logger.info('可用命令: fix, cleanup, reset')
      process.exit(1)
  }
}

module.exports = {
  fixDatabase,
  cleanupOldData,
  resetDatabase
}
