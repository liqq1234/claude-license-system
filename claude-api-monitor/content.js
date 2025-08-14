// content.js - 负责注入脚本到页面 (纯后端版本)
(function() {
  console.log('🔧 Claude API 429 监听器 Content Script 启动');

  // 创建并注入简化版脚本
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject-simple.js');
  script.onload = function() {
    console.log('✅ 429监听脚本加载完成');
    this.remove();
  };
  script.onerror = function() {
    console.error('❌ 429监听脚本加载失败');
    this.remove();
  };

  // 确保在页面加载前注入
  (document.head || document.documentElement).appendChild(script);
})();
