// src/routes/health.ts
/**
 * 健康检查路由
 */

import { Router, Request, Response } from 'express';
import { config } from '../config/app';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查
 *     description: 检查服务器运行状态
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 服务器运行正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 uptime:
 *                   type: number
 *                   example: 3600
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
router.get('/', (req: Request, res: Response) => {
  const healthInfo = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: config.PORT,
    baseUrl: config.BASE_URL
  };

  res.json(healthInfo);
});

export { router as healthRouter };
