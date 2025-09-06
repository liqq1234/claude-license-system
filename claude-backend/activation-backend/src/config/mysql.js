const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// 创建MySQL连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '4693090li',
  database: process.env.DB_NAME || 'license_server', // 使用license_server数据库
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
});

// 测试连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ MySQL 原生连接池创建成功');
    connection.release();
    return true;
  } catch (error) {
    logger.error('❌ MySQL 原生连接池创建失败:', error);
    return false;
  }
}

// 导出连接池
module.exports = pool;

// 测试连接（立即执行）
testConnection();
