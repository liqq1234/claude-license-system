# 激活码监控系统

基于 Vue 3 + Element Plus 的激活码监控管理系统。

## 功能特性

- 📊 **实时统计** - 激活码总数、状态分布、使用情况
- 📈 **数据可视化** - 状态分布饼图、激活趋势图表
- 🔍 **智能搜索** - 支持激活码、描述信息搜索和状态筛选
- 📋 **详细列表** - 完整的激活码信息展示和管理
- ➕ **批量生成** - 支持多种类型激活码批量生成
- 🔧 **操作管理** - 撤销、删除、查看详情等操作
- 📱 **响应式设计** - 适配各种屏幕尺寸

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 项目结构

```
activation-monitor/
├── src/
│   ├── components/          # 组件
│   │   ├── StatCard.vue     # 统计卡片
│   │   ├── StatusChart.vue  # 状态图表
│   │   ├── TrendChart.vue   # 趋势图表
│   │   ├── ActivationTable.vue  # 激活码表格
│   │   ├── GenerateDialog.vue   # 生成对话框
│   │   └── DetailsDialog.vue    # 详情对话框
│   ├── api/                 # API 接口
│   │   └── activation.js    # 激活码相关 API
│   ├── App.vue             # 主应用组件
│   └── main.js             # 入口文件
├── package.json
├── vite.config.js
└── README.md
```

## 配置说明

### 代理配置

在 `vite.config.js` 中配置了 API 代理：

```javascript
// 注意：当前版本已改为直接请求后端，无需代理
// 前端直接请求: http://localhost:8888/v1/xxx
```

### API 接口

系统通过以下接口与后端通信：

- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/codes` - 获取激活码列表
- `POST /api/admin/generate-codes` - 生成激活码
- `POST /api/admin/revoke-code/:code` - 撤销激活码
- `DELETE /api/admin/codes/:code` - 删除激活码
- `GET /api/admin/codes/:code` - 获取激活码详情

## 使用说明

1. **查看统计** - 首页显示激活码总体统计信息
2. **数据可视化** - 通过图表查看状态分布和激活趋势
3. **搜索筛选** - 使用搜索框和状态筛选快速定位激活码
4. **生成激活码** - 点击"生成激活码"按钮批量创建
5. **管理操作** - 在表格中进行撤销、删除、查看详情等操作

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Element Plus** - Vue 3 组件库
- **ECharts** - 数据可视化图表库
- **Axios** - HTTP 客户端
- **Vite** - 前端构建工具

## 开发说明

### 添加新功能

1. 在 `src/components/` 中创建新组件
2. 在 `src/api/activation.js` 中添加相应的 API 方法
3. 在 `App.vue` 中集成新功能

### 自定义样式

系统使用 Element Plus 的默认主题，可以通过 CSS 变量进行自定义：

```css
:root {
  --el-color-primary: #409EFF;
  --el-color-success: #67C23A;
  --el-color-warning: #E6A23C;
  --el-color-danger: #F56C6C;
}
```

## 部署说明

1. 运行 `npm run build` 构建生产版本
2. 将 `dist/` 目录部署到 Web 服务器
3. 确保后端 API 服务正常运行
4. 配置反向代理将 `/api` 请求转发到后端服务

## 注意事项

- 确保后端服务已启动并可访问
- 检查 API 接口地址配置是否正确
- 生产环境需要配置正确的代理或 CORS 设置