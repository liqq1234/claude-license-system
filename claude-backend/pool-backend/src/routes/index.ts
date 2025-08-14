// src/routes/index.ts
/**
 * 路由管理中心
 */

import { Router } from 'express';
import { DatabaseManager } from '../database';
import { healthRouter } from './health';
import { createRateLimitRouter } from '../api/rateLimitApi';
import { createAdminRouter } from '../api/adminApi';
import { createUserRouter } from '../api/userApi';
import { createAccountStatusRouter } from '../api/accountStatusApi';

export function createApiRouter(db: DatabaseManager) {
  const router = Router();

  // 健康检查路由
  router.use('/health', healthRouter);

  // API 路由
  router.use('/api/rate-limit', createRateLimitRouter(db));
  router.use('/api/account-status', createAccountStatusRouter(db));
  router.use('/api/admin', createAdminRouter(db));
  router.use('/api', createUserRouter(db));

  return router;
}
