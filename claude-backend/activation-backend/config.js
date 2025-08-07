'use strict'

const path = require('path')

module.exports = {
  name: 'node-license-server',
  identity: 'ClientSoftware',

  // Redis 配置
  redis: {
    host: 'localhost',
    port: 6379,
    password: '123456',
    db: 0
  },

  // MySQL 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'license_server',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '4693090li'
  },

  // 激活码配置
  activation: {
    expireAfter: 365*24*60*60*1000, // 默认过期时间
    maxDevicesPerCode: 5,           // 每个激活码最大设备数
    cacheExpiry: {
      activationCode: 3600,         // 激活码缓存1小时
      deviceBinding: 1800,          // 设备绑定缓存30分钟
      stats: 300                    // 统计数据缓存5分钟
    }
  },

  // RSA 密钥配置
  rsa_private_key: path.join(__dirname, "sample.private.pem"),
  rsa_public_key: path.join(__dirname, "sample.public.pem"),
  rsa_passphrase: "1234",

  // JWT 配置
  jwt_secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '7d',
}



