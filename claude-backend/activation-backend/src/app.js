'use strict'
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { router: apiRouter } = require('./controllers/api');
const authRouter = require('./controllers/auth');
const adminRouter = require('./controllers/admin');
const emailActivationRouter = require('./controllers/emailActivation');
// 新的API路由
const activationApiRouter = require('./routes/activation');
const proxyApiRouter = require('./routes/proxy');
const adminApiRouter = require('./routes/admin');
const claudeProxyRouter = require('./routes/claudeProxy');
const claudeUsersRouter = require('./routes/claudeUsers');
const poolProxyRouter = require('./routes/poolProxy');
const { swaggerUi, specs } = require('./config/swagger');

const app = express();

// 添加 CORS 支持
app.use(cors({
  origin: [
    'http://localhost:3000', // ClaudeProject 前端 (新端口)
    'http://localhost:3001', // ClaudeProject 前端 (旧端口)
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:5173'
  ],
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
app.use('/admin', adminRouter);
app.use('/activation', emailActivationRouter);

// 新的API路由
app.use('/api/activation-codes', activationApiRouter);
app.use('/api/proxy', proxyApiRouter);
app.use('/api/admin', adminApiRouter);
app.use('/api/proxy/claude', claudeProxyRouter);
app.use('/api/claude', claudeUsersRouter);
app.use('/api/pool', poolProxyRouter);
app.get('/', (req, res) => res.redirect('/status'))
app.get('/status', (req, res) => res.json({status: 0}))

app.use((req, res, next) => res.send("404 - 页面未找到"))
app.use((err, req, res, next) => {
  logger.error(err)
  if (res.headersSent) return next(err)
  return res.send("500 - 服务器内部错误")
})

module.exports = app;