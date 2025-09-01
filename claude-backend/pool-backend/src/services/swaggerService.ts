// src/services/swaggerService.ts
/**
 * Swagger 文档服务
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from '../config/app';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pool Backend API',
      version: '1.0.0',
      description: 'Claude账号池管理后端API文档',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: '开发环境'
      },
      {
        url: config.BASE_URL,
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './src/api/*.ts',
    './src/routes/*.ts'
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export function setupSwagger(app: Express): void {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Pool Backend API Documentation'
  }));

  // JSON格式的API文档
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 Swagger文档已启用: http://localhost:${config.PORT}/api-docs`);
}
