/**
 * Token验证和用户权限管理服务
 */

import jwt from 'jsonwebtoken';

// 配置
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || 'http://localhost:8888';
const CLAUDE_BASE_URL = process.env.CLAUDE_BASE_URL || 'https://claude.ai';

// 用户信息接口
interface User {
  id: string;
  username: string;
  email: string;
  membershipStatus: 'active' | 'expired' | 'inactive';
  expiresAt?: string;
}

// 会员状态接口
interface MembershipStatus {
  expired: boolean;
  expiresAt: string | null;
  daysRemaining: number;
}

// 登录token载荷接口
interface LoginTokenPayload {
  userId: string;
  accountId: number;
  sessionKey: string;
  uniqueName: string;
  expiresIn: number;
  email: string;
}

/**
 * 验证用户token
 * 调用激活码后端验证用户身份和权限
 */
export async function validateUserToken(token: string): Promise<User | null> {
  try {
    console.log('🔍 验证用户token:', token.substring(0, 20) + '...');
    
    const response = await fetch(`${LICENSE_SERVER_URL}/api/claude/validate-access`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.log('❌ Token验证失败:', response.status);
      return null;
    }

    const result: any = await response.json();
    console.log('✅ Token验证成功:', result);

    // 检查API响应格式：{ status: 0, data: { hasAccess: true, ... } }
    if (result.status === 0 && result.data && result.data.hasAccess) {
      const userData = result.data;
      return {
        id: userData.userId?.toString() || 'unknown',
        username: userData.username || 'user',
        email: userData.email || '',
        membershipStatus: userData.membershipStatus === 'active' ? 'active' : 'expired',
        expiresAt: userData.expiresAt
      };
    }

    return null;
  } catch (error) {
    console.error('💥 Token验证异常:', error);
    return null;
  }
}

/**
 * 检查会员状态
 */
export async function checkMembershipStatus(userId: string): Promise<MembershipStatus> {
  try {
    console.log('🔍 检查用户会员状态:', userId);

    // 暂时跳过会员状态检查，直接返回允许访问的状态
    // TODO: 后续可以实现真实的会员状态检查接口
    console.log('⚠️ 跳过会员状态检查，默认允许访问');

    return {
      expired: false,
      expiresAt: null,
      daysRemaining: 999
    };
  } catch (error) {
    console.error('💥 会员状态检查异常:', error);
    // 出错时默认允许访问
    return {
      expired: false,
      expiresAt: null,
      daysRemaining: 999
    };
  }
}

/**
 * 生成安全登录token
 * 包含加密的session key和用户信息
 */
export async function generateSecureLoginToken(payload: LoginTokenPayload): Promise<string> {
  try {
    console.log('🔐 生成安全登录token:', {
      userId: payload.userId,
      email: payload.email,
      accountId: payload.accountId
    });

    const tokenPayload = {
      userId: payload.userId,
      accountId: payload.accountId,
      sessionKey: payload.sessionKey, // 加密存储
      uniqueName: payload.uniqueName,
      expiresIn: payload.expiresIn,
      email: payload.email,
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(tokenPayload, SECRET_KEY, {
      algorithm: 'HS256',
      expiresIn: '1h'
    });

    console.log('✅ 安全登录token生成成功');
    return token;
  } catch (error) {
    console.error('💥 生成登录token失败:', error);
    throw new Error('Failed to generate login token');
  }
}

/**
 * 验证并解析登录token
 */
export async function verifyLoginToken(token: string): Promise<LoginTokenPayload | null> {
  try {
    console.log('🔍 验证登录token');
    
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    
    console.log('✅ 登录token验证成功:', {
      userId: decoded.userId,
      email: decoded.email,
      accountId: decoded.accountId
    });

    return {
      userId: decoded.userId,
      accountId: decoded.accountId,
      sessionKey: decoded.sessionKey,
      uniqueName: decoded.uniqueName,
      expiresIn: decoded.expiresIn,
      email: decoded.email
    };
  } catch (error) {
    console.error('❌ 登录token验证失败:', error);
    return null;
  }
}

/**
 * 生成唯一标识符
 */
export function generateUniqueId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 构建Claude登录URL
 */
export function buildClaudeUrl(sessionKey: string, uniqueName: string, expiresIn?: number): string {
  let claudeUrl = `${CLAUDE_BASE_URL}/?sk=${sessionKey}&name=${encodeURIComponent(uniqueName)}`;
  
  if (expiresIn && expiresIn > 0) {
    claudeUrl += `&expires_in=${expiresIn}`;
  }
  
  return claudeUrl;
}

export {
  SECRET_KEY,
  LICENSE_SERVER_URL,
  CLAUDE_BASE_URL
};
