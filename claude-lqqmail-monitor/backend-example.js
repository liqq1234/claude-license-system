// backend-example.js - 接收API状态数据的后端示例
const express = require('express');
const cors = require('cors');
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 存储API状态数据
const apiStatusData = [];
const stats = {
  totalRequests: 0,
  successRequests: 0,
  errorRequests: 0,
  status429Count: 0,
  lastRequest: null
};

// 接收API状态数据
app.post('/api/claude-status', (req, res) => {
  const data = req.body;
  const now = new Date();
  
  console.log(`📡 [${now.toLocaleTimeString()}] 收到API状态:`, {
    type: data.type,
    url: data.url ? data.url.split('/').pop() : 'N/A',
    status: data.statusCode,
    method: data.method,
    timestamp: new Date(data.timestamp).toLocaleTimeString()
  });
  
  // 更新统计
  if (data.type === 'request_completed') {
    stats.totalRequests++;
    stats.lastRequest = now.toISOString();
    
    if (data.statusCode >= 200 && data.statusCode < 400) {
      stats.successRequests++;
    } else {
      stats.errorRequests++;
    }
    
    if (data.statusCode === 429) {
      stats.status429Count++;
      console.log('🚫 检测到429错误!');
      
      if (data.parsedHeaders) {
        console.log('   响应头信息:');
        if (data.parsedHeaders.retryAfter) {
          console.log(`   - Retry-After: ${data.parsedHeaders.retryAfter}秒`);
        }
        if (data.parsedHeaders.xServer) {
          console.log(`   - X-Server: ${data.parsedHeaders.xServer}`);
        }
        if (data.parsedHeaders.xShouldRetry) {
          console.log(`   - X-Should-Retry: ${data.parsedHeaders.xShouldRetry}`);
        }
        if (data.parsedHeaders.requestId) {
          console.log(`   - Request-ID: ${data.parsedHeaders.requestId}`);
        }
      }
    }
    
    // 详细状态日志
    if (data.statusCode !== 200) {
      console.log(`⚠️  状态码 ${data.statusCode}: ${data.statusLine || 'Unknown'}`);
    }
  }
  
  // 存储数据
  apiStatusData.push({
    ...data,
    receivedAt: now.toISOString()
  });
  
  // 只保留最近1000条记录
  if (apiStatusData.length > 1000) {
    apiStatusData.splice(0, apiStatusData.length - 1000);
  }
  
  // 响应
  res.json({
    success: true,
    message: '状态数据接收成功',
    timestamp: now.toISOString(),
    stats: stats
  });
});

// 获取API状态统计
app.get('/api/claude-status/stats', (req, res) => {
  const recentData = apiStatusData.slice(-50); // 最近50条
  const statusCounts = {};
  
  recentData.forEach(item => {
    if (item.statusCode) {
      statusCounts[item.statusCode] = (statusCounts[item.statusCode] || 0) + 1;
    }
  });
  
  res.json({
    success: true,
    stats: stats,
    recentStatusCounts: statusCounts,
    recentDataCount: recentData.length,
    totalDataCount: apiStatusData.length
  });
});

// 获取最近的API数据
app.get('/api/claude-status/recent', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const recentData = apiStatusData.slice(-limit);
  
  res.json({
    success: true,
    data: recentData,
    count: recentData.length
  });
});

// 获取429错误数据
app.get('/api/claude-status/429', (req, res) => {
  const status429Data = apiStatusData.filter(item => item.statusCode === 429);
  
  res.json({
    success: true,
    data: status429Data,
    count: status429Data.length
  });
});

// 清除数据
app.delete('/api/claude-status', (req, res) => {
  const count = apiStatusData.length;
  apiStatusData.length = 0;
  
  // 重置统计
  stats.totalRequests = 0;
  stats.successRequests = 0;
  stats.errorRequests = 0;
  stats.status429Count = 0;
  stats.lastRequest = null;
  
  res.json({
    success: true,
    message: `已清除 ${count} 条记录和统计数据`
  });
});

// 实时状态页面
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Claude LQQMail API Monitor</title>
      <meta charset="utf-8">
      <style>
        body { font-family: monospace; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat { text-align: center; padding: 15px; background: #007bff; color: white; border-radius: 6px; }
        .status-429 { background: #dc3545; }
        .status-success { background: #28a745; }
        .status-error { background: #ffc107; color: #333; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .refresh { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📡 Claude LQQMail API Monitor</h1>
        
        <div class="card">
          <h2>实时统计</h2>
          <div class="stats">
            <div class="stat">
              <div>总请求数</div>
              <div id="total-requests">${stats.totalRequests}</div>
            </div>
            <div class="stat status-success">
              <div>成功请求</div>
              <div id="success-requests">${stats.successRequests}</div>
            </div>
            <div class="stat status-error">
              <div>错误请求</div>
              <div id="error-requests">${stats.errorRequests}</div>
            </div>
            <div class="stat status-429">
              <div>429错误</div>
              <div id="status-429">${stats.status429Count}</div>
            </div>
          </div>
          <p>最后请求时间: <span id="last-request">${stats.lastRequest || '无'}</span></p>
        </div>
        
        <div class="card">
          <h2>最近请求 <button onclick="loadRecentData()" class="refresh">刷新</button></h2>
          <pre id="recent-data">加载中...</pre>
        </div>
      </div>
      
      <script>
        function loadRecentData() {
          fetch('/api/claude-status/recent?limit=10')
            .then(r => r.json())
            .then(data => {
              document.getElementById('recent-data').textContent = JSON.stringify(data, null, 2);
            });
        }
        
        function loadStats() {
          fetch('/api/claude-status/stats')
            .then(r => r.json())
            .then(data => {
              const stats = data.stats;
              document.getElementById('total-requests').textContent = stats.totalRequests;
              document.getElementById('success-requests').textContent = stats.successRequests;
              document.getElementById('error-requests').textContent = stats.errorRequests;
              document.getElementById('status-429').textContent = stats.status429Count;
              document.getElementById('last-request').textContent = stats.lastRequest || '无';
            });
        }
        
        // 初始加载
        loadRecentData();
        
        // 每5秒刷新统计
        setInterval(loadStats, 5000);
      </script>
    </body>
    </html>
  `);
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Claude LQQMail API Monitor 后端启动`);
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`📊 状态页面: http://localhost:${PORT}`);
  console.log(`🔗 API端点: http://localhost:${PORT}/api/claude-status`);
  console.log('');
  console.log('等待接收API状态数据...');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 服务器关闭');
  process.exit(0);
});
