'use strict'
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { router: apiRouter } = require('./controllers/api');
const authRouter = require('./controllers/auth');
const emailActivationRouter = require('./controllers/emailActivation');
// 新的API路由
const activationApiRouter = require('./routes/activation');
const proxyApiRouter = require('./routes/proxy');
const adminApiRouter = require('./routes/admin');
const claudeProxyRouter = require('./routes/claudeProxy');
const claudeUsersRouter = require('./routes/claudeUsers');
const poolProxyRouter = require('./routes/poolProxy');
const packagesRouter = require('./routes/packages');
const midjourneyRouter = require('./routes/midjourney');
const { swaggerUi, specs } = require('./config/swagger');

const app = express();

// 添加 CORS 支持
app.use(cors({
  origin: function (origin, callback) {
    // 允许没有origin的请求(比如移动端应用)
    if (!origin) return callback(null, true);
    
    // 允许的源列表
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8082',
      'http://127.0.0.1:8083',
      'http://127.0.0.1:5173',
      'https://ai.lqqmail.xyz',
      'https://admin.lqqmail.xyz',
      'https://claude.lqqmail.xyz'
    ];
    
    // 检查是否是允许的源
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // 检查是否是局域网IP (192.168.x.x)
    if (origin && origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/)) {
      return callback(null, true);
    }
    
    // 检查是否是本地IP (10.x.x.x 或 172.x.x.x)
    if (origin && (
      origin.match(/^http:\/\/10\.\d+\.\d+\.\d+:\d+$/) ||
      origin.match(/^http:\/\/172\.\d+\.\d+\.\d+:\d+$/)
    )) {
      return callback(null, true);
    }
    
    callback(new Error('不允许的CORS来源'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.debug('查询参数:', req.query)
  logger.debug('POST数据:', req.body)
  return next()
})

// Swagger UI 路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 提供 JSON 格式的 API 规范（用于 swagger-typescript-api）
app.get('/api-docs-json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(specs);
});

app.use('/v1', apiRouter);
app.use('/auth', authRouter);
app.use('/activation', emailActivationRouter);

// 新的API路由
app.use('/api/activation-codes', activationApiRouter);
app.use('/api/proxy', proxyApiRouter);
app.use('/api/admin', adminApiRouter);
app.use('/api/proxy/claude', claudeProxyRouter);
app.use('/api/claude', claudeUsersRouter);
app.use('/api/pool', poolProxyRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/midjourney', midjourneyRouter);
app.get('/', (req, res) => res.redirect('/status'))
app.get('/status', (req, res) => res.json({status: 0}))

app.use((req, res, next) => res.send("404 - 页面未找到"))
app.use((err, req, res, next) => {
  logger.error(err)
  if (res.headersSent) return next(err)
  return res.send("500 - 服务器内部错误")
})

module.exports = app;