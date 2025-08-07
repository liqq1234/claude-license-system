const { Sequelize } = require('sequelize')
const logger = require('../utils/logger')

// 数据库配置
const dbConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'license_server',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '4693090li',
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  production: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'license_server',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
}

// 获取当前环境配置
const env = process.env.NODE_ENV || 'development'
const config = dbConfig[env]

// 创建 Sequelize 实例
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    define: config.define,
    timezone: '+08:00' // 设置时区
  }
)

// 测试数据库连接
async function testConnection() {
  try {
    logger.info('🔧 数据库连接参数:', {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password ? '4693090li' : 'undefined'
    })

    await sequelize.authenticate()
    logger.info('✅ MySQL 数据库连接成功')
    return true
  } catch (error) {
    logger.error('❌ MySQL 数据库连接失败:', error)
    logger.error('❌ 详细错误信息:', error)
    return false
  }
}

// 同步数据库表结构
async function syncDatabase(force = false) {
  try {
    logger.info('🔄 开始同步数据库表结构...')

    if (force) {
      logger.warn('⚠️ 强制同步模式：将删除现有表并重新创建')
    }

    await sequelize.sync({ force })
    logger.info('✅ 数据库表结构同步完成')
    return true
  } catch (error) {
    logger.error('❌ 数据库表结构同步失败:', error.message)
    return false
  }
}

// 关闭数据库连接
async function closeConnection() {
  try {
    await sequelize.close()
    logger.info('📴 MySQL 数据库连接已关闭')
  } catch (error) {
    logger.error('❌ 关闭数据库连接失败:', error.message)
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
  config
}
