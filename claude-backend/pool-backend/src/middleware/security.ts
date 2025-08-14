// src/middleware/security.ts
/**
 * 安全相关中间件
 */

import express from 'express';

// 安全头部中间件
export const securityHeaders = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
};
