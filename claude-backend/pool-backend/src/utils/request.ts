// src/utils/request.ts
/**
 * 请求相关工具函数
 */

import express from 'express';

/**
 * 获取客户端真实IP地址
 */
export function getClientIP(req: express.Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim();
}

/**
 * 获取用户代理字符串
 */
export function getUserAgent(req: express.Request): string {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * 记录请求信息
 */
export function logRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
  const start = Date.now();
  const ip = getClientIP(req);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';

    console.log(
      `${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${ip}`
    );
  });

  next();
}
