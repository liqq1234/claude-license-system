// src/utils/apiClient.ts
/**
 * 统一的 Axios API 客户端
 */

import axios, { AxiosInstance } from 'axios';

// 创建一个通用的 Axios 实例
const apiClient: AxiosInstance = axios.create({
  timeout: 15000, // 默认超时时间
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'ClaudePoolManager/1.0'
  }
});

// 响应拦截器 - 用于日志记录和统一错误处理
apiClient.interceptors.response.use(
  (response) => {
    // 只返回响应数据
    return response.data;
  },
  (error) => {
    console.error('API Request Error:', {
      message: error.message,
      url: error.config.url,
      method: error.config.method,
      status: error.response?.status
    });
    return Promise.reject(error);
  }
);

export default apiClient;

