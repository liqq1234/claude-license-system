# Claude 认证系统

一个基于 Vue 3 + Element Plus 的现代化认证系统，包含登录、注册、用户管理等功能。

## 🚀 项目特性

- **现代化技术栈**: Vue 3 + Vite + Element Plus + Pinia
- **完整认证流程**: 登录、注册、密码重置、用户管理
- **响应式设计**: 支持桌面端和移动端
- **状态管理**: 使用 Pinia 进行状态管理
- **路由守卫**: 完整的路由权限控制
- **模块化架构**: 清晰的项目结构，易于扩展

## 📁 项目结构

```
claude-auth-system/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API 接口
│   │   └── auth.js        # 认证相关 API
│   ├── components/        # 公共组件
│   │   └── common/        # 通用组件
│   │       └── AuthLayout.vue  # 认证页面布局
│   ├── router/            # 路由配置
│   │   └── index.js       # 路由定义和守卫
│   ├── stores/            # 状态管理
│   │   └── auth.js        # 认证状态管理
│   ├── views/             # 页面组件
│   │   ├── auth/          # 认证相关页面
│   │   │   ├── Login.vue  # 登录页面
│   │   │   └── Register.vue # 注册页面
│   │   ├── Dashboard.vue  # 控制台页面
│   │   └── Profile.vue    # 个人资料页面
│   ├── style.css          # 全局样式
│   ├── main.js            # 应用入口
│   └── App.vue            # 根组件
├── package.json           # 项目配置
├── vite.config.js         # Vite 配置
└── README.md              # 项目说明
```

## 🛠️ 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **HTTP 客户端**: Axios
- **样式**: CSS3 + Element Plus 主题

## 📦 安装和运行

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 🎨 设计特色

### 视觉设计
- **主题色**: 紫色 (#8B55FC) 科技感配色
- **圆角设计**: 16px 统一圆角，现代化风格
- **毛玻璃效果**: 半透明背景，增加层次感
- **渐变背景**: 蓝紫色渐变，营造科技氛围

### 交互体验
- **流畅动画**: 页面切换和组件交互动画
- **桌面端优化**: 专为桌面端设计的布局和交互
- **表单验证**: 实时验证和友好提示
- **加载状态**: 清晰的加载反馈

## 🔐 功能模块

### 认证系统
- [x] 用户登录
- [x] 用户注册
- [x] 密码重置
- [x] 记住登录状态
- [x] 自动登录
- [x] 登出功能

### 用户管理
- [x] 个人资料编辑
- [x] 头像上传
- [x] 密码修改
- [x] 账户信息管理

### 页面功能
- [x] 控制台首页
- [x] 数据统计展示
- [x] 快速操作面板
- [x] 用户下拉菜单

## 🚦 路由配置

| 路径 | 组件 | 说明 | 权限 |
|------|------|------|------|
| `/` | - | 重定向到登录页 | 公开 |
| `/login` | Login.vue | 登录页面 | 游客 |
| `/register` | Register.vue | 注册页面 | 游客 |
| `/dashboard` | Dashboard.vue | 控制台 | 需要登录 |
| `/profile` | Profile.vue | 个人资料 | 需要登录 |

## 🔧 配置说明

### 环境变量
```bash
# API 基础地址
VITE_API_BASE_URL=http://localhost:3001/api
```

### 路径别名
```javascript
// vite.config.js
resolve: {
  alias: {
    '@': resolve(__dirname, 'src')
  }
}
```

## 💻 桌面端设计

- **固定宽度**: 560px 认证表单容器
- **最佳分辨率**: 1920x1080 及以上
- **浏览器支持**: Chrome, Firefox, Safari, Edge

## 🎯 后续扩展计划

- [ ] 多语言支持 (i18n)
- [ ] 暗黑模式切换
- [ ] 第三方登录集成
- [ ] 权限角色管理
- [ ] 数据可视化图表
- [ ] 消息通知系统
- [ ] 文件上传管理
- [ ] 系统设置页面

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Pinia](https://pinia.vuejs.org/) - Vue 状态管理库
