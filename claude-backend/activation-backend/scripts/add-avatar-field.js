/**
 * 数据库迁移脚本：为用户表添加avatar字段
 */

const { Sequelize, DataTypes } = require('sequelize')
const config = require('../config')
const logger = require('../src/utils/logger')
const { generateUserAvatar } = require('../src/utils/avatarGenerator')

// 创建数据库连接
const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: (msg) => logger.info(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
)

async function addAvatarField() {
  try {
    console.log('🔄 开始添加avatar字段到users表...')
    
    // 检查字段是否已存在
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'avatar'
      AND TABLE_SCHEMA = DATABASE()
    `)
    
    if (results.length > 0) {
      console.log('✅ avatar字段已存在，跳过添加')
    } else {
      // 添加avatar字段
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN avatar VARCHAR(500) NULL COMMENT '用户头像URL' 
        AFTER email
      `)
      console.log('✅ avatar字段添加成功')
    }
    
    // 为现有用户生成头像
    console.log('🔄 为现有用户生成头像...')
    
    const [users] = await sequelize.query(`
      SELECT id, username, email, avatar 
      FROM users 
      WHERE avatar IS NULL OR avatar = ''
    `)
    
    console.log(`📊 找到 ${users.length} 个需要生成头像的用户`)
    
    let updatedCount = 0
    for (const user of users) {
      try {
        const avatar = generateUserAvatar(user.username, user.email)
        
        await sequelize.query(`
          UPDATE users 
          SET avatar = :avatar 
          WHERE id = :id
        `, {
          replacements: { avatar, id: user.id }
        })
        
        updatedCount++
        console.log(`✅ 用户 ${user.username} (${user.email}) 头像生成成功: ${avatar}`)
      } catch (error) {
        console.error(`❌ 用户 ${user.username} 头像生成失败:`, error.message)
      }
    }
    
    console.log(`🎉 迁移完成！共为 ${updatedCount} 个用户生成了头像`)
    
    // 验证结果
    const [finalResults] = await sequelize.query(`
      SELECT COUNT(*) as total_users,
             COUNT(avatar) as users_with_avatar
      FROM users
    `)
    
    const stats = finalResults[0]
    console.log(`📊 最终统计: 总用户数 ${stats.total_users}, 有头像用户数 ${stats.users_with_avatar}`)
    
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await sequelize.close()
  }
}

// 执行迁移
if (require.main === module) {
  addAvatarField()
    .then(() => {
      console.log('🎉 数据库迁移完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 数据库迁移失败:', error)
      process.exit(1)
    })
}

module.exports = { addAvatarField }
