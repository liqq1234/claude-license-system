# 🤖 Claude License System

一个完整的Claude账号池管理系统，支持用户注册、激活码验证、账号池管理和直接聊天功能。

## 🌟 功能特性

- ✅ **用户注册登录** - 邮箱验证、激活码系统
- ✅ **账号池管理** - Claude账号的统一管理
- ✅ **直接聊天** - 点击账号卡片直接跳转Claude聊天界面
- ✅ **安全隐私** - Session Key完全隐藏，用户无法看到
- ✅ **权限控制** - 基于激活码的访问权限管理
- ✅ **多端支持** - 响应式设计，支持桌面和移动端

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Vue.js)  │    │  认证服务 (Node) │    │ Pool服务 (Node)  │
│   Port: 5173    │◄──►│   Port: 8888    │◄──►│   Port: 3456    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ MySQL (用户数据) │    │ MySQL (账号池)   │
                       │ license_server  │    │   claudehub     │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js 16+
- MySQL 5.7+
- npm 或 yarn

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/claude-license-system.git
cd claude-license-system
```

### 2. 配置环境变量

复制示例环境变量文件并修改配置：

```bash
# 前端配置
cp claude-frontend/.env.example claude-frontend/.env

# 认证服务配置
cp claude-backend/activation-backend/.env.example claude-backend/activation-backend/.env

# Pool服务配置
cp claude-backend/pool-backend/.env.example claude-backend/pool-backend/.env
```

### 3. 安装依赖

```bash
# 前端依赖
cd claude-frontend
npm install

# 认证服务依赖
cd ../claude-backend/activation-backend
npm install

# Pool服务依赖
cd ../pool-backend
npm install
```

### 4. 数据库设置

创建MySQL数据库：

```sql
-- 用户认证数据库
CREATE DATABASE license_server;

-- 账号池数据库
CREATE DATABASE claudehub;
```

### 5. 启动服务

```bash
# 方式1: 一键启动所有服务
./start-all-services.bat

# 方式2: 分别启动
# 认证服务
cd claude-backend/activation-backend && npm run dev

# Pool服务
cd claude-backend/pool-backend && npm run dev

# 前端服务
cd claude-frontend && npm run dev
```

### 6. 访问应用

- 前端应用: http://localhost:5173
- API文档: http://localhost:3456/api-docs

## 📁 项目结构

```
claude-license-system/
├── claude-frontend/              # Vue.js 前端
│   ├── src/
│   │   ├── views/                # 页面组件
│   │   ├── api/                  # API接口
│   │   ├── stores/               # 状态管理
│   │   └── components/           # 通用组件
│   └── package.json
├── claude-backend/
│   ├── activation-backend/       # 用户认证服务
│   │   ├── src/
│   │   ├── database/            # 数据库脚本
│   │   └── package.json
│   └── pool-backend/            # 账号池管理服务
│       ├── src/
│       ├── database/            # 数据库脚本
│       └── package.json
└── README.md
```

## 🔧 配置说明

### 前端配置 (.env)

```env
VITE_API_BASE_URL=http://localhost:8888          # 认证服务地址
VITE_CLAUDE_POOL_API_URL=http://localhost:3456   # Pool服务地址
VITE_APP_NAME=Claude License System              # 应用名称
```

### 认证服务配置 (.env)

```env
PORT=8888                        # 服务端口
DB_HOST=localhost               # 数据库地址
DB_NAME=license_server          # 数据库名称
SMTP_HOST=smtp.163.com          # 邮件服务器
SMTP_USER=your_email@163.com    # 邮箱账号
```

### Pool服务配置 (.env)

```env
PORT=3456                           # 服务端口
BASE_URL=https://claude.ai          # Claude镜像地址
DB_NAME=claudehub                   # 数据库名称
ADMIN_PASSWORD=your_admin_password  # 管理员密码
```

## 🎯 使用流程

1. **用户注册** - 填写邮箱和密码，接收验证码
2. **激活账号** - 输入激活码激活账号
3. **选择账号** - 在账号列表中选择Claude账号
4. **直接聊天** - 点击账号卡片直接跳转到Claude聊天界面

## 🛡️ 安全特性

- **Session Key隐藏** - 用户完全看不到SK
- **Token验证** - 使用安全的登录token机制
- **权限检查** - 验证用户激活码状态
- **邮箱脱敏** - 返回脱敏后的邮箱信息
- **过期控制** - 支持token过期时间设置

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题，请联系：
- 邮箱: your-email@example.com
- 微信: your-wechat-id
