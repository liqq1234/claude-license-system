console.log('=== 环境变量调试信息 ===');
console.log('VITE_ACTIVATION_API_URL:', import.meta.env.VITE_ACTIVATION_API_URL);
console.log('VITE_CLAUDE_POOL_API_URL:', import.meta.env.VITE_CLAUDE_POOL_API_URL);
console.log('MODE:', import.meta.env.MODE);
console.log('所有环境变量:', import.meta.env);

// 导出以便在其他地方使用
export const debugEnv = () => {
  return {
    activationApiUrl: import.meta.env.VITE_ACTIVATION_API_URL,
    poolApiUrl: import.meta.env.VITE_CLAUDE_POOL_API_URL,
    mode: import.meta.env.MODE,
    all: import.meta.env
  };
};
