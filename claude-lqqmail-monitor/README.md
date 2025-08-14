# Claude LQQMail API Monitor

## 🎯 **功能说明**

专门监听 `claude.lqqmail.xyz` 的 API 请求状态，特别关注 429 错误。

## 📊 **监听目标**

```
URL: https://claude.lqqmail.xyz/api/organizations/*/chat_conversations/*/completion
方法: POST
状态: 重点监听 429 Too Many Requests
```

## 🔧 **监听方式**

### **1. webRequest API (后台脚本)**
- 使用 Chrome 扩展的 `webRequest` API
- 在网络层面拦截请求和响应
- 获取完整的 HTTP 状态码和响应头

### **2. fetch 拦截 (页面脚本)**
- 在页面中拦截 `fetch` 请求
- 获取响应体内容
- 触发自定义事件

### **3. 实时显示 (内容脚本)**
- 在页面右上角显示实时状态
- 特别标记 429 错误
- 显示重试时间等信息

## 📦 **文件结构**

```
claude-lqqmail-monitor/
├── manifest.json          # 扩展配置
├── background.js           # 后台脚本 (webRequest监听)
├── content.js             # 内容脚本 (页面显示)
├── inject.js              # 注入脚本 (fetch拦截)
├── backend-example.js     # 后端示例
└── README.md              # 使用说明
```

## 🚀 **安装使用**

### **1. 安装扩展**
```
1. 打开 chrome://extensions/
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 claude-lqqmail-monitor 文件夹
```

### **2. 启动后端**
```bash
cd claude-lqqmail-monitor
npm init -y
npm install express cors
node backend-example.js
```

### **3. 测试监听**
```
1. 访问 https://claude.lqqmail.xyz
2. 发送消息触发API请求
3. 查看页面右上角状态显示
4. 查看后端控制台输出
```

## 📡 **监听效果**

### **页面显示**
```
📡 Claude LQQMail API Monitor
┌─────────────────────────────┐
│ 200 OK              14:30:25│
│ .../completion              │
│                             │
│ 🚫 请求被限制               │
│ 重试等待: 3600秒            │
│ 服务器: Fuclaude/0.3.12     │
│                             │
│ 总请求: 5 | 清除            │
└─────────────────────────────┘
```

### **控制台输出**
```
🚀 API 请求开始: {
  url: "https://claude.lqqmail.xyz/api/.../completion",
  method: "POST",
  timestamp: "2025-08-14T04:53:55.000Z"
}

✅ API 请求完成: {
  status: 429,
  statusLine: "Too Many Requests",
  timestamp: "2025-08-14T04:53:55.000Z"
}

🚫 检测到 429 Too Many Requests!
```

### **后端接收**
```
📡 [12:53:55] 收到API状态: {
  type: 'request_completed',
  url: 'completion',
  status: 429,
  method: 'POST',
  timestamp: '12:53:55'
}

🚫 检测到429错误!
   响应头信息:
   - X-Server: Fuclaude/0.3.12
   - X-Should-Retry: true
   - Request-ID: req_011CS71Dv3k4cvnc5yaRCt64
```

## 📊 **数据格式**

### **发送到后端的数据**
```json
{
  "type": "request_completed",
  "requestId": "12345",
  "url": "https://claude.lqqmail.xyz/api/.../completion",
  "method": "POST",
  "statusCode": 429,
  "statusLine": "Too Many Requests",
  "timestamp": 1692123456789,
  "timestampISO": "2025-08-14T04:53:55.000Z",
  "tabId": 123,
  "is429": true,
  "parsedHeaders": {
    "retryAfter": null,
    "contentType": "application/json",
    "server": "nginx/1.29.0",
    "xServer": "Fuclaude/0.3.12",
    "xShouldRetry": "true",
    "requestId": "req_011CS71Dv3k4cvnc5yaRCt64",
    "date": "Thu, 14 Aug 2025 04:53:55 GMT"
  }
}
```

## 🔧 **配置修改**

### **修改后端地址**
在 `background.js` 中：
```javascript
const BACKEND_CONFIG = {
  url: 'http://your-backend.com/api/claude-status',
  enabled: true,
  timeout: 5000
};
```

### **添加更多监听URL**
在 `background.js` 中：
```javascript
urls: [
  "*://claude.lqqmail.xyz/api/organizations/*/chat_conversations/*/completion",
  "*://your-domain.com/api/*"  // 添加其他URL
]
```

## 🎯 **特点**

- ✅ **多层监听** - webRequest + fetch 双重拦截
- ✅ **实时显示** - 页面状态栏实时更新
- ✅ **429专注** - 特别关注和处理429错误
- ✅ **详细信息** - 完整的请求响应数据
- ✅ **后端集成** - 自动发送数据到后端
- ✅ **可视化** - 后端提供Web界面查看统计

现在您可以完整监听 `claude.lqqmail.xyz` 的API状态了！
