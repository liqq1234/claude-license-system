// src/middleware/rateLimit.ts
/**
 * 请求频率限制中间件
 */

import express from 'express';
import { getClientIP } from '../utils/request';

// 请求频率限制存储
const rateLimitStore = new Map();

export function createRateLimit(windowMs: number, max: number, message: string = '请求过于频繁，请稍后再试') {
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
