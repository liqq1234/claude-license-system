// src/middleware/cors.ts
/**
 * CORS 中间件配置
 */

import cors from 'cors';
import { corsConfig } from '../config/app';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // 允许没有origin的请求（如移动应用、Postman、本地文件等）
    if (!origin || origin === 'null') return callback(null, true);

    if (corsConfig.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'sentry-trace',        // Sentry 追踪头部
    'baggage',             // Sentry 相关头部
    'x-requested-with',    // AJAX 请求头部
    'accept',              // 接受类型头部
    'origin',              // 来源头部
    'user-agent'           // 用户代理头部
  ],
  credentials: true // 允许携带cookies
});
