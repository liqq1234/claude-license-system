#!/usr/bin/env node
'use strict'

const { Sequelize, DataTypes } = require('sequelize')
const logger = require('../utils/logger')

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'license_server',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '4693090li',
  dialect: 'mysql',
  logging: (msg) => logger.info(msg),
  timezone: '+08:00'
}

// 创建数据库连接
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    timezone: dbConfig.timezone
  }
)

async function fixCreatedAtFields() {
  try {
    logger.info('🔧 开始修复 created_at 字段...')
    
    // 1. 测试数据库连接
    await sequelize.authenticate()
    logger.info('✅ 数据库连接成功')
    
    // 2. 检查表结构
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${dbConfig.database}' 
      AND TABLE_NAME = 'activation_codes'
      AND COLUMN_NAME IN ('created_at', 'updated_at')
    `)
    
    logger.info('📋 当前时间字段状态:', results)
    
    // 3. 检查是否需要添加字段
    const hasCreatedAt = results.some(col => col.COLUMN_NAME === 'created_at')
    const hasUpdatedAt = results.some(col => col.COLUMN_NAME === 'updated_at')
    
    if (!hasCreatedAt) {
      logger.info('➕ 添加 created_at 字段...')
      await sequelize.query(`
        ALTER TABLE activation_codes 
        ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        COMMENT '创建时间'
      `)
      logger.info('✅ created_at 字段添加成功')
    } else {
      logger.info('✅ created_at 字段已存在')
    }
    
    if (!hasUpdatedAt) {
      logger.info('➕ 添加 updated_at 字段...')
      await sequelize.query(`
        ALTER TABLE activation_codes 
        ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        COMMENT '更新时间'
      `)
      logger.info('✅ updated_at 字段添加成功')
    } else {
      logger.info('✅ updated_at 字段已存在')
    }
    
    // 4. 更新现有记录的 created_at 字段（如果为 NULL）
    logger.info('🔄 更新现有记录的时间字段...')
    
    const [updateResult] = await sequelize.query(`
      UPDATE activation_codes 
      SET created_at = CURRENT_TIMESTAMP 
      WHERE created_at IS NULL
    `)
    
    logger.info(`✅ 更新了 ${updateResult.affectedRows || 0} 条记录的 created_at 字段`)
    
    // 5. 验证修复结果
    const [verifyResults] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(created_at) as records_with_created_at,
        COUNT(updated_at) as records_with_updated_at
      FROM activation_codes
    `)
    
    logger.info('📊 修复结果验证:', verifyResults[0])
    
    // 6. 显示一些示例数据
    const [sampleData] = await sequelize.query(`
      SELECT code, created_at, updated_at, status
      FROM activation_codes 
      ORDER BY id DESC 
      LIMIT 5
    `)
    
    logger.info('📋 示例数据:')
    sampleData.forEach(record => {
      logger.info(`  ${record.code}: created_at=${record.created_at}, status=${record.status}`)
    })
    
    logger.info('🎉 created_at 字段修复完成！')
    
  } catch (error) {
    logger.error('❌ 修复失败:', error)
    throw error
  } finally {
    await sequelize.close()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixCreatedAtFields()
    .then(() => {
      logger.info('✅ 脚本执行完成')
      process.exit(0)
    })
    .catch(error => {
      logger.error('❌ 脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { fixCreatedAtFields }
