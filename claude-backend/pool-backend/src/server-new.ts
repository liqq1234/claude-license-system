// src/server-new.ts
/**
 * 重构后的服务器主文件
 * 所有功能已分离到不同的模块中
 */

import express from 'express';

// 导入配置
import { config, validateConfig } from './config/app';

// 导入中间件
import { corsMiddleware } from './middleware/cors';
import { securityHeaders } from './middleware/security';
import { createRateLimit } from './middleware/rateLimit';
import { logRequest } from './utils/request';

// 导入路由
import { createApiRouter } from './routes';

// 导入服务
import { setupSwagger } from './services/swaggerService';

// 导入数据库
import { createDatabaseManager } from './database';

/**
 * 创建Express应用
 */
function createApp(db: ReturnType<typeof createDatabaseManager>): express.Application {
  const app = express();

  // 基础中间件
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 安全中间件
  app.use(securityHeaders);

  // CORS中间件
  app.use(corsMiddleware);

  // 请求日志中间件
  app.use(logRequest);

  // 全局限流中间件
  app.use(createRateLimit(60000, 100, '请求过于频繁，请稍后再试'));

  // 设置路由
  app.use('/', createApiRouter(db));

  // 设置Swagger文档
  setupSwagger(app);

  // 404处理
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  });

  // 全局错误处理
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('🚨 服务器错误:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  });

  return app;
}

/**
 * 启动服务器
 */
async function startServer() {
  try {
    console.log('🚀 启动 Pool Backend 服务器...');

    // 验证配置
    validateConfig();

    // 初始化数据库
    console.log('📊 初始化数据库连接...');
    const db = createDatabaseManager(process.env);

    // 测试数据库连接
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败');
    }
    console.log('✅ 数据库连接成功');

    // 创建应用
    const app = createApp(db);

    // 启动服务器
    const server = app.listen(config.PORT, () => {
      console.log('\n🎉 服务器启动成功!');
      console.log(`📡 服务器地址: http://localhost:${config.PORT}`);
      console.log(`📚 API文档: http://localhost:${config.PORT}/api-docs`);
      console.log(`🏥 健康检查: http://localhost:${config.PORT}/health`);
      console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📴 收到 ${signal} 信号，开始优雅关闭...`);
      
      server.close(async () => {
        console.log('🔌 HTTP服务器已关闭');
        
        try {
          await db.close();
          console.log('📊 数据库连接已关闭');
          console.log('✅ 服务器已优雅关闭');
          process.exit(0);
        } catch (error) {
          console.error('❌ 关闭数据库连接时出错:', error);
          process.exit(1);
        }
      });
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 监听未捕获的异常
    process.on('uncaughtException', (error) => {
      console.error('🚨 未捕获的异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 未处理的Promise拒绝:', reason);
      console.error('Promise:', promise);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
if (require.main === module) {
  startServer();
}

export { createApp, startServer };
