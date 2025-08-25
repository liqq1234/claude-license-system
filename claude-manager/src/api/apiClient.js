import axios from 'axios';
import { ElMessage } from 'element-plus';

// --- Activation API Client (activation-backend) ---
const activationApi = axios.create({
      baseURL: import.meta.env.VITE_ACTIVATION_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 调试信息
console.log('=== Activation API Client 初始化 ===');
console.log('VITE_ACTIVATION_API_URL:', import.meta.env.VITE_ACTIVATION_API_URL);
console.log('baseURL设置为:', activationApi.defaults.baseURL);



activationApi.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.message || error.message || 'Activation service request failed';
    ElMessage.error(message);
    return Promise.reject(new Error(message));
  }
);

// --- Pool API Client (pool-backend) ---
const poolApi = axios.create({
      baseURL: import.meta.env.VITE_CLAUDE_POOL_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

poolApi.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.error || error.message || 'Pool service request failed';
    ElMessage.error(message);
    return Promise.reject(new Error(message));
  }
);

export { activationApi, poolApi };

