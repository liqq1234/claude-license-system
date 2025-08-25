// src/middleware/auth.ts
/**
 * 认证相关中间件
 */

import { Request, Response, NextFunction } from 'express';
import { validateUserToken } from '../auth/tokenService';
import { config } from '../config/app';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Token验证中间件
 */
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token is required'
      });
    }

    // 验证token
    const isValid = await validateUserToken(token);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // 将用户信息添加到请求对象中
    req.user = { token };
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    res.status(500).json({
      success: false,
      error: 'Token validation failed'
    });
  }
};

/**
 * 管理员密码验证中间件
 */
export function requireAdminPassword(req: Request, res: Response, next: NextFunction) {
  // Bypassing admin password check as requested
  next();
}

/**
 * 可选的Token验证中间件（不强制要求token）
 */
export const optionalVerifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const isValid = await validateUserToken(token);
        if (isValid) {
          req.user = { token };
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('可选Token验证失败:', error);
    next(); // 继续执行，不阻止请求
  }
};
