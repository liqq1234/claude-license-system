// src/config/app.ts
/**
 * 应用配置管理
 */

import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 环境变量接口
export interface Config {
  PORT: number;
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
export const config: Config = {
  PORT: parseInt(process.env.PORT || '8787'),
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

// CORS 配置
export const corsConfig = {
  allowedOrigins: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8083', // 添加8083端口支持
    'http://localhost:5173', // 添加Vite默认端口
    'https://claude.lqqmail.xyz',
    'https://www.claude.lqqmail.xyz',
    'https://admin.lqqmail.xyz',  // 添加管理后台域名
    'https://ai.lqqmail.xyz'      // 添加AI服务域名
  ]
};

// 验证配置
export function validateConfig(): void {
  const requiredEnvVars = ['DB_PASSWORD'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }
  
  console.log('✅ 配置验证通过');
  console.log(`📡 服务端口: ${config.PORT}`);
  console.log(`🌐 基础URL: ${config.BASE_URL}`);
  console.log(`🗄️ 数据库: ${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);
}
