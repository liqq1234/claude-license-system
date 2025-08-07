/**
 * 数据库迁移脚本
 * 创建新的表结构
 */

const { sequelize } = require('../src/models')
const logger = require('../src/utils/logger')

async function migrateDatabase() {
  try {
    logger.info('🔄 开始数据库迁移...')

    // 同步所有模型到数据库
    await sequelize.sync({ alter: true })
    
    logger.info('✅ 数据库迁移完成')
    
    // 检查表是否创建成功
    const tables = await sequelize.getQueryInterface().showAllTables()
    logger.info('📋 当前数据库表:', tables)
    
    // 创建默认管理员账号（如果不存在）
    await createDefaultAdmin()
    
    // 创建示例Token（开发环境）
    if (process.env.NODE_ENV !== 'production') {
      await createSampleTokens()
    }
    
    logger.info('🎉 数据库初始化完成')
    
  } catch (error) {
    logger.error('❌ 数据库迁移失败:', error)
    throw error
  }
}

async function createDefaultAdmin() {
  try {
    const { User } = require('../src/models')
    const bcrypt = require('bcrypt')
    
    const adminEmail = 'admin@example.com'
    const existingAdmin = await User.findOne({ where: { email: adminEmail } })
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123456', 10)
      
      await User.create({
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      })
      
      logger.info('👤 默认管理员账号已创建:')
      logger.info('   邮箱: admin@example.com')
      logger.info('   密码: admin123456')
      logger.info('   ⚠️  请在生产环境中修改默认密码！')
    } else {
      logger.info('👤 管理员账号已存在，跳过创建')
    }
  } catch (error) {
    logger.error('创建默认管理员失败:', error)
  }
}

async function createSampleTokens() {
  try {
    const { TokenPool } = require('../src/models')
    const tokenPoolService = require('../src/services/tokenPoolService')
    
    const existingTokens = await TokenPool.count()
    
    if (existingTokens === 0) {
      logger.info('🔑 创建示例Token...')
      
      // 创建示例Gamma Token
      await tokenPoolService.addToken({
        serviceType: 'gamma',
        accountAlias: 'gamma_demo_1',
        accessToken: 'demo_gamma_token_1',
        refreshToken: 'demo_gamma_refresh_1',
        maxConcurrentUsers: 3,
        maxDailyUsage: 50
      })
      
      // 创建示例Figma Token
      await tokenPoolService.addToken({
        serviceType: 'figma',
        accountAlias: 'figma_demo_1',
        accessToken: 'demo_figma_token_1',
        refreshToken: 'demo_figma_refresh_1',
        maxConcurrentUsers: 2,
        maxDailyUsage: 30
      })
      
      logger.info('✅ 示例Token创建完成')
      logger.info('   ⚠️  这些是演示Token，请在生产环境中替换为真实Token')
    } else {
      logger.info('🔑 Token池已有数据，跳过创建示例Token')
    }
  } catch (error) {
    logger.error('创建示例Token失败:', error)
  }
}

async function createSampleActivationCodes() {
  try {
    const { ActivationCode } = require('../src/models')
    const activationService = require('../src/services/activationService')
    
    const existingCodes = await ActivationCode.count()
    
    if (existingCodes === 0) {
      logger.info('🎫 创建示例激活码...')
      
      // 创建一些测试激活码
      await activationService.generateActivationCodes({
        count: 10,
        serviceType: 'gamma',
        validDays: 30,
        maxUsagePerCode: 30,
        description: '测试用Gamma激活码',
        adminUserId: 'system'
      })
      
      await activationService.generateActivationCodes({
        count: 5,
        serviceType: 'figma',
        validDays: 30,
        maxUsagePerCode: 50,
        description: '测试用Figma激活码',
        adminUserId: 'system'
      })
      
      logger.info('✅ 示例激活码创建完成')
    } else {
      logger.info('🎫 激活码已存在，跳过创建示例激活码')
    }
  } catch (error) {
    logger.error('创建示例激活码失败:', error)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      logger.info('🎉 迁移脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('❌ 迁移脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = {
  migrateDatabase,
  createDefaultAdmin,
  createSampleTokens,
  createSampleActivationCodes
}
