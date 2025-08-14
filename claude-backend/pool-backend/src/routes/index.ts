// src/routes/index.ts
/**
 * 路由管理中心
 */

import { Router } from 'express';
import { DatabaseManager } from '../database';
import { healthRouter } from './health';
import { router as rateLimitRouter } from '../api/rateLimitApi';
import { router as claudeStatusRouter } from '../api/claudeStatusApi';
import { createAdminRouter } from '../api/adminApi';
import { createUserRouter } from '../api/userApi';

export function createApiRouter(db: DatabaseManager) {
  const router = Router();

  // 健康检查路由
  router.use('/health', healthRouter);

  // API 路由
  router.use('/api/rate-limit', rateLimitRouter);
  router.use('/api/claude-status', claudeStatusRouter);
  router.use('/api/admin', createAdminRouter(db));
  router.use('/api', createUserRouter(db));

  return router;
}
