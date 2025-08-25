// src/utils/claudeStatusChecker.ts
/**
 * Claude 镜像网站状态检测工具
 * 用于在登录前检测网站状态，包括 429 限流检测和冷却时间获取
 */

import apiClient from './apiClient';
import { AxiosError } from 'axios';

export interface ClaudeStatusResult {
  isAvailable: boolean;
  statusCode: number;
  isRateLimited: boolean;
  cooldownTime?: number; // 冷却时间（秒）
  retryAfter?: number; // Retry-After 头部值（秒）
  errorMessage?: string;
  responseTime: number; // 响应时间（毫秒）
  timestamp: string;
}

export interface ClaudeStatusCheckOptions {
  timeout?: number; // 请求超时时间（毫秒），默认 10000
  userAgent?: string; // User-Agent，默认使用标准浏览器 UA
  followRedirects?: boolean; // 是否跟随重定向，默认 true
}

/**
 * 检测 Claude 镜像网站状态
 * @param baseUrl Claude 镜像网站的基础 URL
 * @param options 检测选项
 * @returns Promise<ClaudeStatusResult>
 */
export async function checkClaudeStatus(
  baseUrl: string,
  options: ClaudeStatusCheckOptions = {}
): Promise<ClaudeStatusResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  const {
    timeout = 10000,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    followRedirects = true
  } = options;

  try {
    console.log(`🔍 开始检测 Claude 网站状态: ${baseUrl}`);

    const checkUrl = `${baseUrl}/chat`;

    const response = await apiClient.get(checkUrl, {
      timeout,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      maxRedirects: followRedirects ? 5 : 0,
      validateStatus: () => true, // 让axios不因4xx/5xx状态码抛出错误
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    console.log(`📊 Claude 网站响应: ${statusCode} (${responseTime}ms)`);

    if (statusCode === 429) {
      const retryAfterHeader = response.headers['retry-after'];
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

      let cooldownTime = retryAfter;
      let errorMessage = 'Rate limited (429)';

      const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.retryAfter) cooldownTime = jsonResponse.retryAfter;
        if (jsonResponse.message) errorMessage = jsonResponse.message;
      } catch {
        const cooldownMatch = responseText.match(/(\d+)\s*秒后重试|retry\s+after\s+(\d+)\s*seconds?/i);
        if (cooldownMatch) {
          cooldownTime = parseInt(cooldownMatch[1] || cooldownMatch[2], 10);
        }
      }

      console.log(`🚫 Claude 网站被限流: ${statusCode}, 冷却时间: ${cooldownTime}秒`);

      return {
        isAvailable: false,
        statusCode,
        isRateLimited: true,
        cooldownTime,
        retryAfter,
        errorMessage,
        responseTime,
        timestamp
      };
    }

    if (statusCode >= 500) {
      console.log(`❌ Claude 网站服务器错误: ${statusCode}`);
      return { isAvailable: false, statusCode, isRateLimited: false, errorMessage: `Server error (${statusCode})`, responseTime, timestamp };
    }

    if (statusCode >= 400) {
      console.log(`⚠️ Claude 网站客户端错误: ${statusCode}`);
      return { isAvailable: false, statusCode, isRateLimited: false, errorMessage: `Client error (${statusCode})`, responseTime, timestamp };
    }

    if (statusCode >= 200 && statusCode < 300) {
      console.log(`✅ Claude 网站可用: ${statusCode}`);
      return { isAvailable: true, statusCode, isRateLimited: false, responseTime, timestamp };
    }

    console.log(`🔄 Claude 网站重定向: ${statusCode}`);
    return { isAvailable: true, statusCode, isRateLimited: false, responseTime, timestamp };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Claude 网站检测失败:', error);

    let errorMessage = 'Network error';
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Request timeout';
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorMessage = 'Connection refused or host not found';
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      isAvailable: false,
      statusCode: 0,
      isRateLimited: false,
      errorMessage,
      responseTime,
      timestamp
    };
  }
}

/**
 * 批量检测多个 Claude 镜像网站状态
 * @param baseUrls Claude 镜像网站 URL 列表
 * @param options 检测选项
 * @returns Promise<Map<string, ClaudeStatusResult>>
 */
export async function checkMultipleClaudeStatus(
  baseUrls: string[],
  options: ClaudeStatusCheckOptions = {}
): Promise<Map<string, ClaudeStatusResult>> {
  console.log(`🔍 开始批量检测 ${baseUrls.length} 个 Claude 网站状态`);
  
  const results = new Map<string, ClaudeStatusResult>();
  
  // 并发检测所有网站
  const promises = baseUrls.map(async (url) => {
    const result = await checkClaudeStatus(url, options);
    results.set(url, result);
    return { url, result };
  });

  await Promise.allSettled(promises);
  
  console.log(`✅ 批量检测完成，共检测 ${results.size} 个网站`);
  return results;
}

/**
 * 获取可用的 Claude 镜像网站
 * @param baseUrls Claude 镜像网站 URL 列表
 * @param options 检测选项
 * @returns Promise<string[]> 可用的网站 URL 列表
 */
export async function getAvailableClaudeSites(
  baseUrls: string[],
  options: ClaudeStatusCheckOptions = {}
): Promise<string[]> {
  const results = await checkMultipleClaudeStatus(baseUrls, options);
  
  const availableSites: string[] = [];
  
  for (const [url, result] of results) {
    if (result.isAvailable && !result.isRateLimited) {
      availableSites.push(url);
    }
  }
  
  console.log(`📊 找到 ${availableSites.length} 个可用的 Claude 网站`);
  return availableSites;
}
