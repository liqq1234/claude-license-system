// src/server.ts
/**
 * Claude Pool Manager - Node.js + Express + MySQL 版本
 * 纯后端服务，不依赖 Cloudflare Workers
 */

// 首先加载环境变量
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { DatabaseManager, createDatabaseManager, ClaudeAccount, UsageLog, AdminLog } from './database';
import { specs, swaggerUi, swaggerUiOptions } from './config/swagger';
import {
  validateUserToken,
  checkMembershipStatus,
  generateSecureLoginToken,
  verifyLoginToken,
  generateUniqueId,
  buildClaudeUrl
} from './auth/tokenService';

// 确保fetch可用（Node.js 18+内置，否则需要polyfill）
if (typeof fetch === 'undefined') {
  // @ts-ignore
  global.fetch = require('node-fetch');
}

// 环境变量接口
interface Config {
  PORT: number;
  ADMIN_PASSWORD: string;
  BASE_URL: string;
  TOKEN_EXPIRES_IN: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_CONNECTION_LIMIT: number;
  DB_ACQUIRE_TIMEOUT: number;
  DB_TIMEOUT: number;
}

// 加载配置
const config: Config = {
  PORT: parseInt(process.env.PORT || '8787'),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || (() => {
    console.error('🚨 SECURITY WARNING: ADMIN_PASSWORD not set in environment variables!');
    console.error('🚨 Using default password is EXTREMELY DANGEROUS in production!');
    return 'CHANGE_ME_IMMEDIATELY_' + Math.random().toString(36);
  })(),
  BASE_URL: process.env.BASE_URL || 'https://claude.lqqmail.xyz',
  TOKEN_EXPIRES_IN: parseInt(process.env.TOKEN_EXPIRES_IN || '0'),
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306'),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || (() => {
    console.error('🚨 SECURITY WARNING: DB_PASSWORD not set in environment variables!');
    throw new Error('Database password must be set in environment variables for security');
  })(),
  DB_NAME: process.env.DB_NAME || 'claudehub',
  DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  DB_ACQUIRE_TIMEOUT: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
  DB_TIMEOUT: parseInt(process.env.DB_TIMEOUT || '60000')
};

// 创建 Express 应用
const app = express();

// 中间件 - 安全的CORS配置
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'https://claude.lqqmail.xyz',
  'https://www.claude.lqqmail.xyz'
];

app.use(cors({
  origin: (origin, callback) => {
    // 允许没有origin的请求（如移动应用、Postman等）
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // 允许携带cookies
}));

app.use(express.json({ limit: '10mb' })); // 限制请求体大小

// 安全头部中间件
app.use((req, res, next) => {
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');

  // 防止MIME类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS保护
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 强制HTTPS（生产环境）
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // 内容安全策略
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");

  // 隐藏服务器信息
  res.removeHeader('X-Powered-By');

  next();
});

// 请求频率限制中间件
const rateLimitStore = new Map();

function createRateLimit(windowMs: number, max: number, message: string = '请求过于频繁，请稍后再试') {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = getClientIP(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // 清理过期的请求记录
    if (rateLimitStore.has(key)) {
      const userRequests = rateLimitStore.get(key).filter((time: number) => time > windowStart);
      rateLimitStore.set(key, userRequests);
    } else {
      rateLimitStore.set(key, []);
    }

    const userRequests = rateLimitStore.get(key);

    if (userRequests.length >= max) {
      console.warn(`🚨 Rate limit exceeded for IP: ${key}`);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    userRequests.push(now);
    next();
  };
}

// Token验证中间件
const verifyToken = async (req: any, res: any, next: any) => {
  try {
    console.log('🔍 开始token验证...');

    // 从Authorization header获取token
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.body.token || req.query.token;

    if (!token) {
      console.log('❌ 缺少token');
      return res.status(401).json({ error: 'Token required' });
    }

    // 验证token并获取用户信息
    const user = await validateUserToken(token);
    if (!user) {
      console.log('❌ Token无效');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('✅ 用户验证成功:', user.username);

    // 检查会员状态
    const membershipStatus = await checkMembershipStatus(user.id);
    if (membershipStatus.expired) {
      console.log('❌ 会员已过期');
      return res.status(403).json({
        error: 'Membership expired',
        expiresAt: membershipStatus.expiresAt,
        message: '您的会员已过期，请续费后继续使用'
      });
    }

    console.log('✅ 会员状态正常，剩余天数:', membershipStatus.daysRemaining);

    // 将用户信息添加到请求对象
    req.user = user;
    req.membershipStatus = membershipStatus;
    next();
  } catch (error) {
    console.error('💥 Token验证异常:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// 创建数据库管理器
const db = createDatabaseManager(config);

// 工具函数
function getClientIP(req: express.Request): string {
  return req.headers['x-forwarded-for'] as string ||
         req.headers['x-real-ip'] as string ||
         req.connection.remoteAddress ||
         'unknown';
}

function getUserAgent(req: express.Request): string {
  return req.headers['user-agent'] || 'unknown';
}

// 邮箱脱敏函数
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return 'Claude账号';
  }

  const [localPart, domain] = email.split('@');

  // 如果本地部分长度小于等于3，只显示第一个字符
  if (localPart.length <= 3) {
    return `${localPart[0]}***@${domain}`;
  }

  // 显示前2个字符和后1个字符，中间用*代替
  const maskedLocal = `${localPart.substring(0, 2)}***${localPart.substring(localPart.length - 1)}`;
  return `${maskedLocal}@${domain}`;
}

// 构建直接聊天URL函数
function buildDirectChatUrl(baseUrl: string, token: string): string {
  // 根据不同的Claude镜像站点构建合适的聊天URL
  const url = new URL(baseUrl);

  // 根据域名特征选择合适的路径
  const hostname = url.hostname.toLowerCase();
  let chatPath = '/chat';

  if (hostname.includes('claude.ai')) {
    // 官方Claude.ai
    chatPath = '/chat';
  } else if (hostname.includes('fuclaude')) {
    // FuClaude镜像
    chatPath = '/chat';
  } else if (hostname.includes('lqqmail')) {
    // 你的镜像站点 - 可能需要不同的路径
    chatPath = '/'; // 尝试根路径
  } else {
    // 其他镜像站点，尝试常见路径
    chatPath = '/';
  }

  console.log(`🔗 构建聊天URL: ${baseUrl}${chatPath}?token=${token}`);
  return `${baseUrl}${chatPath}?token=${token}`;
}

function sortEmails(emails: string[]): string[] {
  return emails.sort((a, b) => {
    const aDomain = a.split('@')[1];
    const bDomain = b.split('@')[1];
    if (aDomain !== bDomain) {
      return aDomain.localeCompare(bDomain);
    }
    return a.localeCompare(b);
  });
}

// Swagger文档路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// 提供JSON格式的API规范
app.get('/api-docs-json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(specs);
});

// 路由处理

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查
 *     description: 检查服务和数据库连接状态
 *     tags: [System]
 *     responses:
 *       200:
 *         description: 服务正常
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       500:
 *         description: 服务异常
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 健康检查
app.get('/health', async (req, res) => {
  try {
    const isConnected = await db.testConnection();
    res.json({
      status: 'healthy',
      version: 'nodejs-mysql',
      timestamp: new Date().toISOString(),
      database: {
        type: 'mysql',
        host: config.DB_HOST,
        database: config.DB_NAME,
        status: isConnected ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/emails:
 *   get:
 *     summary: 获取可用邮箱列表
 *     description: 获取所有可用于登录的Claude账号邮箱列表，按域名和邮箱名排序
 *     tags: [User]
 *     responses:
 *       200:
 *         description: 成功获取邮箱列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailListResponse'
 *             example:
 *               emails:
 *                 - "user1@example.com"
 *                 - "user2@example.com"
 *                 - "admin@test.com"
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/emails: 获取可用账号列表 (脱敏处理)
app.get('/api/emails', async (req, res) => {
  try {
    const accounts = await db.getAllAccounts();
    const accountList = accounts.map(account => ({
      id: account.id,
      email: maskEmail(account.email), // 脱敏邮箱
      name: `Claude #${account.id}` // 账号昵称
    }));
    res.json({ accounts: accountList });
  } catch (error) {
    console.error('获取账号列表失败:', error);
    res.status(500).json({ error: 'Failed to get account list' });
  }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: 用户登录
 *     description: 获取Claude登录链接，支持随机选择账号或指定账号登录
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             random:
 *               summary: 随机登录
 *               value:
 *                 mode: "random"
 *                 expires_in: 3600
 *             specific:
 *               summary: 指定账号登录（推荐）
 *               value:
 *                 mode: "specific"
 *                 account_id: 3
 *                 unique_name: "session_123"
 *                 expires_in: 7200
 *             specific_legacy:
 *               summary: 指定账号登录（兼容旧版本）
 *               value:
 *                 mode: "specific"
 *                 email: "user@example.com"
 *                 unique_name: "session_123"
 *                 expires_in: 7200
 *     responses:
 *       200:
 *         description: 成功获取登录链接
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               login_url: "https://claude.ai/login?token=abc123"
 *               warning: "Token有效期已调整为最大允许值"
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 指定邮箱不存在或无可用账号
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// POST /api/login: 用户登录 (需要token验证)
app.post('/api/login', verifyToken, async (req: any, res) => {
  try {
    const { mode, email, unique_name, expires_in } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    console.log(`🎯 用户 ${username} 请求登录，模式: ${mode}, 邮箱: ${email || '随机'}`);

    const accounts = await db.getAllAccounts();
    let selectedAccount: ClaudeAccount | null = null;
    let uniqueName: string;

    if (mode === 'random') {
      if (accounts.length === 0) {
        console.log('❌ 没有可用账号');
        return res.status(503).json({ error: 'No accounts available for random selection' });
      }
      selectedAccount = accounts[Math.floor(Math.random() * accounts.length)];
      uniqueName = unique_name || generateUniqueId();
      console.log(`🎲 随机选择账号: ${selectedAccount.email}`);
    } else if (mode === 'specific') {
      const { account_id, email } = req.body;

      if (account_id) {
        // 通过账号ID指定登录（推荐方式）
        selectedAccount = await db.getAccountById(account_id);
        uniqueName = unique_name || generateUniqueId();
        console.log(`🎯 通过ID指定账号: ${account_id}`);
      } else if (email) {
        // 通过邮箱指定登录（兼容旧版本）
        selectedAccount = await db.getAccountByEmail(email);
        uniqueName = unique_name || generateUniqueId();
        console.log(`🎯 通过邮箱指定账号: ${email}`);
      } else {
        return res.status(400).json({ error: 'Account ID or email is required for specific mode' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid login mode specified. Must be "specific" or "random".' });
    }

    if (!selectedAccount) {
      console.log('❌ 账号不存在或不可用');
      return res.status(404).json({ error: 'Account not found or unavailable' });
    }

    // 直接调用OAuth API获取登录URL（复制index.ts的成功逻辑）
    const expiresIn = expires_in || config.TOKEN_EXPIRES_IN;
    console.log(`🔐 为用户 ${username} 直接生成Claude登录链接`);

    console.log('🔄 开始Claude OAuth token交换...');

    const oauthPayload = {
      session_key: selectedAccount.session_key,
      unique_name: uniqueName,
      expires_in: expiresIn
    };

    console.log('📤 OAuth请求载荷:', {
      session_key: `${selectedAccount.session_key.substring(0, 20)}...`,
      unique_name: uniqueName,
      expires_in: expiresIn
    });

    const oauthResponse = await fetch(`${config.BASE_URL}/manage-api/auth/oauth_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ClaudePoolManager/1.0'
      },
      body: JSON.stringify(oauthPayload)
    });

    if (!oauthResponse.ok) {
      const errorText = await oauthResponse.text();
      console.error('❌ OAuth API调用失败:', oauthResponse.status, errorText);
      throw new Error(`Claude OAuth failed: ${oauthResponse.status}`);
    }

    const oauthData = await oauthResponse.json() as any;
    console.log('📨 OAuth响应:', { login_url: oauthData.login_url ? '✅存在' : '❌缺失' });

    if (!oauthData.login_url) {
      console.error('❌ OAuth响应缺少login_url:', oauthData);
      throw new Error('OAuth successful, but login_url was not returned');
    }

    // 构建最终登录URL（完全复制index.ts的逻辑）
    const chatUrl = `${config.BASE_URL}${oauthData.login_url}`;

    // 记录使用日志
    try {
      await db.logUsage({
        account_id: selectedAccount.id!,
        email: selectedAccount.email,
        login_mode: mode,
        unique_name: uniqueName,
        expires_in: expiresIn > 0 ? expiresIn : undefined,
        client_ip: getClientIP(req),
        user_agent: getUserAgent(req),
        success: true
      });

      // 更新账户使用统计
      await db.updateAccountUsage(selectedAccount.email);
      console.log(`📊 记录用户 ${username} 使用账号 ${selectedAccount.email}`);
    } catch (logError) {
      console.error('Failed to log usage:', logError);
    }

    console.log(`✅ 为用户 ${username} 生成直接聊天链接成功`);

    // 邮箱脱敏处理
    const maskedEmail = maskEmail(selectedAccount.email);

    res.json({
      chat_url: chatUrl, // 改为直接聊天URL
      login_url: chatUrl, // 保持兼容性
      email: maskedEmail, // 返回脱敏后的邮箱
      account_name: `Claude #${selectedAccount.id}`, // 账号昵称
      unique_name: uniqueName,
      expires_in: expiresIn > 0 ? expiresIn : null,
      warning: expiresIn > config.TOKEN_EXPIRES_IN ? 'Token有效期已调整为最大允许值' : undefined
    });

  } catch (error) {
    console.error('💥 Login failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 管理员密码验证中间件
function requireAdminPassword(req: express.Request, res: express.Response, next: express.NextFunction) {
  const { admin_password } = req.body;
  if (admin_password !== config.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
  }
  next();
}

// 调用OAuth API获取登录URL
async function exchangeClaudeTokenWithOAuth(sessionKey: string, uniqueName: string, expiresIn: number = 0): Promise<{
  success: boolean;
  login_url?: string;
  warning?: string;
  error?: string;
}> {
  try {
    console.log(`� 开始Claude OAuth token交换: ${uniqueName}`);

    // 验证session key格式
    if (!sessionKey || !sessionKey.startsWith('sk-ant-')) {
      return {
        success: false,
        error: 'Invalid session key format. Must start with "sk-ant-"'
      };
    }

    // 构建OAuth请求载荷
    const oauthPayload = {
      session_key: sessionKey,
      unique_name: uniqueName,
      expires_in: expiresIn
    };

    // 调用你的域名的OAuth API
    const oauthResponse = await fetch(`${config.BASE_URL}/manage-api/auth/oauth_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ClaudePoolManager/1.0'
      },
      body: JSON.stringify(oauthPayload)
    });

    if (!oauthResponse.ok) {
      const errorText = await oauthResponse.text();
      console.error(`❌ Claude OAuth失败: ${oauthResponse.status} - ${errorText}`);
      return {
        success: false,
        error: `Token exchange failed with status ${oauthResponse.status}: ${errorText}`
      };
    }

    const oauthData = await oauthResponse.json() as any;

    if (!oauthData.login_url) {
      console.error('❌ Claude OAuth响应缺少login_url:', oauthData);
      return {
        success: false,
        error: 'Token exchange successful, but login_url was not returned'
      };
    }

    // 构建完整的登录URL
    const fullLoginUrl = `${config.BASE_URL}${oauthData.login_url}`;

    console.log(`✅ Claude OAuth成功: ${fullLoginUrl.substring(0, 50)}...`);

    return {
      success: true,
      login_url: fullLoginUrl,
      warning: oauthData.warning
    };

  } catch (error) {
    console.error('❌ Claude OAuth网络错误:', error);
    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Claude OAuth Token交换函数（备用方案）
async function exchangeClaudeToken(sessionKey: string, uniqueName: string, expiresIn: number = 0): Promise<{
  success: boolean;
  login_url?: string;
  warning?: string;
  error?: string;
}> {
  try {
    console.log(`🔄 开始Claude OAuth token交换: ${uniqueName}`);

    // 构建OAuth请求载荷
    const oauthPayload = {
      session_key: sessionKey,
      unique_name: uniqueName,
      expires_in: expiresIn
    };

    // 调用Claude官方OAuth API
    const response = await fetch('https://claude.ai/manage-api/auth/oauth_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ClaudePoolManager/1.0'
      },
      body: JSON.stringify(oauthPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Claude OAuth失败: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `Claude OAuth failed with status ${response.status}: ${errorText}`
      };
    }

    const data = await response.json() as any;

    if (!data.login_url) {
      console.error('❌ Claude OAuth响应缺少login_url:', data);
      return {
        success: false,
        error: 'Claude OAuth successful, but login_url was not returned'
      };
    }

    console.log(`✅ Claude OAuth成功: ${data.login_url.substring(0, 50)}...`);

    return {
      success: true,
      login_url: data.login_url,
      warning: data.warning
    };

  } catch (error) {
    console.error('❌ Claude OAuth网络错误:', error);
    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * @swagger
 * /api/admin/list:
 *   post:
 *     summary: 获取账户列表
 *     description: 获取所有Claude账户的列表，包括邮箱和Session Key预览
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminRequest'
 *           example:
 *             admin_password: "admin123"
 *     responses:
 *       200:
 *         description: 成功获取账户列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccountInfo'
 *             example:
 *               - index: 1
 *                 email: "user1@example.com"
 *                 sk_preview: "sk-ant-api03-abc123...xyz789"
 *               - index: 2
 *                 email: "user2@example.com"
 *                 sk_preview: "sk-ant-api03-def456...uvw012"
 *       401:
 *         description: 管理员密码错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// POST /api/admin/list: 获取账户列表
app.post('/api/admin/list', requireAdminPassword, async (req, res) => {
  try {
    const accounts = await db.getAllAccounts();
    const listWithIndexAndPreview = accounts.map((account, index) => ({
      index: index + 1,
      email: account.email,
      sk_preview: account.session_key ? 
        `${account.session_key.slice(0, 20)}...${account.session_key.slice(-10)}` : 
        "SK_INVALID_OR_MISSING"
    }));
    res.json(listWithIndexAndPreview);
  } catch (error) {
    console.error('获取账户列表失败:', error);
    res.status(500).json({ error: 'Failed to get account list' });
  }
});

/**
 * @swagger
 * /api/admin/add:
 *   post:
 *     summary: 添加账户
 *     description: 添加新的Claude账户到账户池
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddAccountRequest'
 *           example:
 *             admin_password: "admin123"
 *             email: "newuser@example.com"
 *             sk: "sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456789"
 *     responses:
 *       200:
 *         description: 账户添加成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "Account added successfully"
 *               data:
 *                 id: 123
 *                 email: "newuser@example.com"
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 管理员密码错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 邮箱已存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// POST /api/admin/add: 添加账户
app.post('/api/admin/add', requireAdminPassword, async (req, res) => {
  try {
    const { email, sk } = req.body;
    
    if (!email || !sk) {
      return res.status(400).json({ error: 'Email and SK are required for adding an account.' });
    }

    // 检查邮箱是否已存在
    const existingAccount = await db.getAccountByEmail(email);
    if (existingAccount) {
      return res.status(409).json({ error: `Email ${email} already exists. Use update if intended.` });
    }

    const accountId = await db.addAccount({
      email: email,
      session_key: sk,
      status: 1,
      created_by: 'admin'
    });

    // 记录管理员操作日志
    await db.logAdminAction({
      action: 'add',
      target_email: email,
      new_data: { email: email, sk: sk.substring(0, 20) + '...' },
      admin_ip: getClientIP(req),
      user_agent: getUserAgent(req),
      success: true
    });

    console.log(`Admin action: Account ${email} added successfully.`);
    res.json({ message: `Account ${email} added successfully.`, id: accountId });

  } catch (error) {
    console.error('Failed to add account:', error);
    
    // 记录失败日志
    await db.logAdminAction({
      action: 'add',
      target_email: req.body.email,
      admin_ip: getClientIP(req),
      user_agent: getUserAgent(req),
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({ error: 'Failed to add account' });
  }
});

// POST /api/admin/delete: 删除账户
app.post('/api/admin/delete', requireAdminPassword, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for deleting an account.' });
    }

    // 获取要删除的账户信息（用于日志）
    const existingAccount = await db.getAccountByEmail(email);
    if (!existingAccount) {
      return res.status(404).json({ error: `Email ${email} not found. Cannot delete.` });
    }

    const deleted = await db.deleteAccount(email);
    if (!deleted) {
      return res.status(500).json({ error: `Failed to delete account ${email}` });
    }

    // 记录管理员操作日志
    await db.logAdminAction({
      action: 'delete',
      target_email: email,
      old_data: { email: existingAccount.email, sk: existingAccount.session_key.substring(0, 20) + '...' },
      admin_ip: getClientIP(req),
      user_agent: getUserAgent(req),
      success: true
    });

    console.log(`Admin action: Account ${email} deleted successfully.`);
    res.json({ message: `Account ${email} deleted successfully.` });

  } catch (error) {
    console.error('Failed to delete account:', error);

    // 记录失败日志
    await db.logAdminAction({
      action: 'delete',
      target_email: req.body.email,
      admin_ip: getClientIP(req),
      user_agent: getUserAgent(req),
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// POST /api/admin/update: 更新账户
app.post('/api/admin/update', requireAdminPassword, async (req, res) => {
  try {
    const { email, new_email, new_sk } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for updating an account.' });
    }
    if (!new_email && !new_sk) {
      return res.status(400).json({ error: 'Either new_email or new_sk must be provided to perform an update.' });
    }

    // 获取原始账户信息
    const existingAccount = await db.getAccountByEmail(email);
    if (!existingAccount) {
      return res.status(404).json({ error: `Account for ${email} not found. Cannot update.` });
    }

    // 如果要更新邮箱，检查新邮箱是否已存在
    if (new_email && new_email !== email) {
      const conflictAccount = await db.getAccountByEmail(new_email);
      if (conflictAccount) {
        return res.status(409).json({ error: `The new email ${new_email} already exists. Cannot update.` });
      }
    }

    const updates: any = {};
    if (new_email) updates.email = new_email;
    if (new_sk) updates.session_key = new_sk;

    const updated = await db.updateAccount(email, updates);
    if (!updated) {
      return res.status(500).json({ error: `Failed to update account ${email}` });
    }

    // 记录管理员操作日志
    await db.logAdminAction({
      action: 'update',
      target_email: email,
      old_data: {
        email: existingAccount.email,
        sk: existingAccount.session_key.substring(0, 20) + '...'
      },
      new_data: {
        email: new_email || existingAccount.email,
        sk: new_sk ? new_sk.substring(0, 20) + '...' : existingAccount.session_key.substring(0, 20) + '...'
      },
      admin_ip: getClientIP(req),
      user_agent: getUserAgent(req),
      success: true
    });

    const finalEmail = new_email || email;
    console.log(`Admin action: Account ${email} updated successfully. New details -> Email: ${finalEmail}, SK updated: ${!!new_sk}`);
    res.json({ message: `Account ${email} has been updated successfully.` });

  } catch (error) {
    console.error('Failed to update account:', error);

    // 记录失败日志
    await db.logAdminAction({
      action: 'update',
      target_email: req.body.email,
      admin_ip: getClientIP(req),
      user_agent: getUserAgent(req),
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({ error: 'Failed to update account' });
  }
});

// POST /api/admin/login: 管理员登录（真正的Claude OAuth登录）
app.post('/api/admin/login', requireAdminPassword, async (req, res) => {
  try {
    const { mode, email, unique_name, expires_in } = req.body;

    console.log(`🔐 管理员登录请求: mode=${mode}, email=${email || 'random'}, unique_name=${unique_name || 'auto'}`);

    // 参数验证
    if (!mode) {
      return res.status(400).json({ error: 'Mode is required' });
    }

    const accounts = await db.getAllAccounts();
    let selectedAccount: ClaudeAccount | null = null;
    let uniqueName: string;

    if (mode === 'random') {
      // 随机模式：从所有可用账户中随机选择
      if (accounts.length === 0) {
        return res.status(503).json({ error: 'No accounts available for random selection' });
      }

      // 过滤出有效的账户（有session_key的）
      const validAccounts = accounts.filter(account =>
        account.session_key && account.session_key.startsWith('sk-ant-')
      );

      if (validAccounts.length === 0) {
        return res.status(503).json({ error: 'No valid accounts available for random selection' });
      }

      selectedAccount = validAccounts[Math.floor(Math.random() * validAccounts.length)];
      uniqueName = unique_name || `admin_rand_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;

      console.log(`🎲 随机选择账户: ${selectedAccount.email}`);

    } else if (mode === 'specific') {
      // 指定模式：查找特定邮箱的账户
      if (!email) {
        return res.status(400).json({ error: 'Email is required for specific mode' });
      }

      selectedAccount = await db.getAccountByEmail(email);
      if (!selectedAccount) {
        return res.status(404).json({ error: `Account with email ${email} not found` });
      }

      uniqueName = unique_name || `admin_${email.split('@')[0]}_${Date.now().toString(36)}`;

      console.log(`🎯 指定账户: ${selectedAccount.email}`);

    } else {
      return res.status(400).json({ error: 'Invalid login mode specified. Must be "specific" or "random".' });
    }

    if (!selectedAccount) {
      return res.status(404).json({ error: 'Account not found or unavailable' });
    }

    // 验证Session Key格式
    if (!selectedAccount.session_key || !selectedAccount.session_key.startsWith('sk-ant-')) {
      return res.status(400).json({ error: 'Invalid session key format for selected account' });
    }

    // 调用OAuth API获取登录URL
    const expiresIn = expires_in || 0; // 管理员默认不过期
    const directLoginResult = await exchangeClaudeTokenWithOAuth(selectedAccount.session_key, uniqueName, expiresIn);

    // 检查直接登录结果
    if (!directLoginResult.success) {
      console.error(`❌ 直接登录失败: ${directLoginResult.error}`);

      // 记录失败日志
      try {
        await db.logAdminAction({
          action: 'login',
          target_email: selectedAccount.email,
          new_data: { mode: mode, unique_name: uniqueName, expires_in: expiresIn },
          admin_ip: getClientIP(req),
          user_agent: getUserAgent(req),
          success: false,
          error_message: directLoginResult.error
        });
      } catch (logError) {
        console.error('Failed to log admin action error:', logError);
      }

      return res.status(500).json({
        error: `Claude login failed: ${directLoginResult.error}`
      });
    }

    // 记录成功的管理员操作日志
    try {
      await db.logAdminAction({
        action: 'login',
        target_email: selectedAccount.email,
        new_data: { mode: mode, unique_name: uniqueName, expires_in: expiresIn },
        admin_ip: getClientIP(req),
        user_agent: getUserAgent(req),
        success: true
      });

      // 更新账户使用统计
      await db.updateAccountUsage(selectedAccount.email);
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
    }

    console.log(`✅ Admin login成功: ${selectedAccount.email} via ${mode} mode`);

    // 返回成功响应（符合前端ClaudeLoginManager期望的格式）
    const response: any = {
      login_url: directLoginResult.login_url,
      selectedEmail: selectedAccount.email, // 前端期望的字段名
      uniqueName: uniqueName, // 前端期望的字段名
      // 保持向后兼容
      email: selectedAccount.email,
      unique_name: uniqueName,
      expires_in: expiresIn > 0 ? expiresIn : null
    };

    // 如果有警告信息，添加到响应中
    if (directLoginResult.warning) {
      response.warning = directLoginResult.warning;
    }

    res.json(response);

  } catch (error) {
    console.error('Admin login failed:', error);

    // 记录失败日志
    try {
      await db.logAdminAction({
        action: 'login',
        target_email: req.body.email,
        admin_ip: getClientIP(req),
        user_agent: getUserAgent(req),
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (logError) {
      console.error('Failed to log admin action error:', logError);
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/accounts-with-sk: 获取账户列表和完整的 Session Key（用于直登功能）
app.post('/api/admin/accounts-with-sk', requireAdminPassword, async (req, res) => {
  try {
    const accounts = await db.getAllAccounts();
    const accountsWithSK = accounts.map((account, index) => ({
      index: index + 1,
      email: account.email,
      session_key: account.session_key, // 返回完整的 Session Key
      sk_preview: account.session_key ?
        `${account.session_key.slice(0, 20)}...${account.session_key.slice(-10)}` :
        "SK_INVALID_OR_MISSING"
    }));

    console.log(`Admin requested accounts with SK: ${accountsWithSK.length} accounts`);
    res.json(accountsWithSK);
  } catch (error) {
    console.error('获取账户和SK失败:', error);
    res.status(500).json({ error: 'Failed to get accounts with session keys' });
  }
});

// GET /secure-login: 处理安全登录token并跳转到Claude
app.get('/secure-login', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('Missing login token');
    }

    console.log('🔐 处理安全登录请求');

    // 验证并解析登录token
    const loginData = await verifyLoginToken(token as string);
    if (!loginData) {
      return res.status(401).send('Invalid or expired login token');
    }

    console.log('✅ 登录token验证成功:', {
      userId: loginData.userId,
      email: loginData.email,
      accountId: loginData.accountId
    });

    // 调用OAuth API获取登录URL
    const claudeResult = await exchangeClaudeTokenWithOAuth(
      loginData.sessionKey,
      loginData.uniqueName,
      loginData.expiresIn
    );

    if (!claudeResult.success || !claudeResult.login_url) {
      console.error('❌ Claude OAuth失败:', claudeResult.error);
      return res.status(500).send(`Claude login failed: ${claudeResult.error}`);
    }

    console.log('✅ Claude OAuth成功，跳转到:', claudeResult.login_url);

    // 直接跳转到Claude登录URL
    res.redirect(claudeResult.login_url);

  } catch (error) {
    console.error('💥 安全登录处理失败:', error);
    res.status(500).send('Internal server error');
  }
});

// GET /direct-chat: 直接跳转到聊天界面，绕过登录页面
app.get('/direct-chat', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('Missing login token');
    }

    console.log('💬 处理直接聊天请求');

    // 验证并解析登录token
    const loginData = await verifyLoginToken(token as string);
    if (!loginData) {
      return res.status(401).send('Invalid or expired login token');
    }

    console.log('✅ 聊天token验证成功:', {
      userId: loginData.userId,
      email: loginData.email,
      accountId: loginData.accountId
    });

    // 直接调用OAuth API获取登录URL（完全复制index.ts的逻辑）
    console.log('🔄 开始Claude OAuth token交换...');

    const oauthPayload = {
      session_key: loginData.sessionKey,
      unique_name: loginData.uniqueName,
      expires_in: loginData.expiresIn
    };

    console.log('📤 OAuth请求载荷:', {
      session_key: `${loginData.sessionKey.substring(0, 20)}...`,
      unique_name: loginData.uniqueName,
      expires_in: loginData.expiresIn
    });

    const oauthResponse = await fetch(`${config.BASE_URL}/manage-api/auth/oauth_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ClaudePoolManager/1.0'
      },
      body: JSON.stringify(oauthPayload)
    });

    if (!oauthResponse.ok) {
      const errorText = await oauthResponse.text();
      console.error('❌ OAuth API调用失败:', oauthResponse.status, errorText);
      return res.status(500).send(`Claude OAuth failed: ${oauthResponse.status}`);
    }

    const oauthData = await oauthResponse.json() as any;
    console.log('📨 OAuth响应:', { login_url: oauthData.login_url ? '✅存在' : '❌缺失' });

    if (!oauthData.login_url) {
      console.error('❌ OAuth响应缺少login_url:', oauthData);
      return res.status(500).send('OAuth successful, but login_url was not returned');
    }

    // 构建最终登录URL（完全复制index.ts的逻辑）
    const finalLoginUrl = `${config.BASE_URL}${oauthData.login_url}`;
    console.log('✅ 最终登录URL构建成功:', finalLoginUrl.substring(0, 50) + '...');

    // 直接跳转到Claude登录URL
    res.redirect(finalLoginUrl);

  } catch (error) {
    console.error('💥 直接聊天处理失败:', error);
    res.status(500).send('Internal server error');
  }
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const isConnected = await db.testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }
    
    console.log('✅ 数据库连接成功');
    
    app.listen(config.PORT, () => {
      console.log(`🚀 Claude Pool Manager 服务启动成功`);
      console.log(`📡 服务地址: http://localhost:${config.PORT}`);
      console.log(`🗄️  数据库: ${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);
      console.log(`🔐 管理员密码: ${config.ADMIN_PASSWORD}`);
    });
    
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 正在关闭服务...');
  await db.close();
  process.exit(0);
});

// 启动服务
startServer();
