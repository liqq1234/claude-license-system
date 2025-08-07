// 首先加载环境变量
require('dotenv').config();

process.env['NODE_ENV'] = '';
const logger = require('./src/utils/logger');

let port = process.env.PORT || 8889

logger.info(`当前环境: ${process.env['NODE_ENV']}`)
if (process.env['NODE_ENV'] == 'production') {
  port = 80
  logger.info('生产环境：重定向控制台输出到日志系统')
  console.warn = logger.warn.bind(logger)
  console.info = logger.info.bind(logger)
  console.error = logger.error.bind(logger)
}

// 异步启动服务器
async function startServer() {
  try {
    const app = require('./src/app');

    // 等待一小段时间确保所有初始化完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start listening for requests.
    app.listen(port, '0.0.0.0', () => {
      logger.info(`🚀 服务器已启动！`)
      logger.info(`📡 监听地址: http://0.0.0.0:${port}`)
      logger.info(`📖 API文档: http://localhost:${port}/api-docs`)
      logger.info(`🎯 健康检查: http://localhost:${port}/status`)

      // 启动定期检查过期激活码的任务
      startExpirationChecker();

      // 启动新的清理服务
      startCleanupService();
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动过期检查器
function startExpirationChecker() {
  // 每5分钟检查一次过期的激活码
  const checkInterval = 5 * 60 * 1000; // 5分钟

  const checkExpiredCodes = async () => {
    try {
      const { ActivationManager } = require('./src/services/activation');
      const activationManager = global.activationManager;

      if (activationManager && activationManager.storage) {
        const expiredCount = await activationManager.storage.checkExpiredActivationCodes();
        if (expiredCount > 0) {
          logger.info(`🕒 定期检查：处理了 ${expiredCount} 个过期激活码`);
        }
      }
    } catch (error) {
      logger.error('定期检查过期激活码失败:', error);
    }
  };

  // 立即执行一次检查
  setTimeout(checkExpiredCodes, 10000); // 10秒后执行第一次检查

  // 设置定期检查
  setInterval(checkExpiredCodes, checkInterval);

  logger.info(`⏰ 过期检查器已启动，每 ${checkInterval / 1000 / 60} 分钟检查一次`);
}

// 启动新的清理服务
function startCleanupService() {
  try {
    const cleanupService = require('./src/services/cleanupService');
    cleanupService.start();
    logger.info('🧹 清理服务已启动');
  } catch (error) {
    logger.error('启动清理服务失败:', error);
  }
}

startServer();

process.on('uncaughtException', err => {
  console.error('未捕获的异常:', err.toString())
  if (err.message && err.message.includes('Redis connection')) {
    console.error('Redis 连接错误，请检查 Redis 服务是否启动')
  }
});

process.on('unhandledRejection', error => {
  console.error('未处理的Promise拒绝:', error.toString())
  if (error.message && error.message.includes('Redis connection')) {
    console.error('Redis 连接错误，请检查 Redis 服务是否启动')
  }
});

