// src/utils/helpers.ts
/**
 * 通用工具函数
 */

/**
 * 邮箱脱敏函数
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }

  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  } else if (localPart.length <= 4) {
    return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
  } else {
    return `${localPart.substring(0, 2)}${'*'.repeat(localPart.length - 4)}${localPart.substring(localPart.length - 2)}@${domain}`;
  }
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse(str: string, defaultValue: any = null): any {
  try {
    return JSON.parse(str);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * 格式化时间差
 */
export function formatTimeDifference(timestamp: number): string {
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return `${seconds}秒前`;
  }
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证URL格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
