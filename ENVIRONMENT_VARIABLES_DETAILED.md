# 环境变量详细说明文档

## 📖 概述

本文档详细说明了Claude License System项目中所有环境变量的用途、默认值以及在代码中的具体使用位置。

---

## 🔧 activation-backend 环境变量

### 基础应用配置

#### `NODE_ENV`
- **用途**: 指定应用运行环境
- **默认值**: `development`
- **可选值**: `development`, `production`
- **代码位置**:
  - `src/utils/logger.js:28` - 控制日志输出方式
  - `src/services/userService.js:269,289,304` - 控制开发环境调试信息
  - `src/services/hybridStorage.js:210` - 控制错误堆栈显示
  - `src/controllers/api.js:402,693` - 控制API错误信息详细程度
  - `src/config/database.js:49` - 数据库配置选择
  - `index.js:9` - 生产环境端口设置
- **说明**: 生产环境下会隐藏敏感错误信息，开启文件日志

#### `PORT`
- **用途**: 应用服务监听端口
- **默认值**: `8888`
- **代码位置**:
  - `index.js:7` - 主服务启动端口
- **说明**: 建议生产环境保持8888，避免与其他服务冲突

### 数据库配置

#### `DB_HOST`
- **用途**: MySQL数据库主机地址
- **默认值**: `localhost`
- **代码位置**:
  - `src/config/database.js:7,27` - Sequelize数据库连接配置
  - `src/tools/fix-created-at.js:9` - 数据库迁移工具
  - `config.js:19` - 数据库配置模块
- **说明**: 宝塔部署时使用 `host.docker.internal` 或服务器内网IP

#### `DB_PORT`
- **用途**: MySQL数据库端口
- **默认值**: `3306`
- **代码位置**:
  - `src/config/database.js:8,28` - 数据库连接端口
  - `src/tools/fix-created-at.js:10` - 迁移工具端口
  - `config.js:20` - 配置模块端口
- **说明**: MySQL标准端口，通常无需修改

#### `DB_NAME`
- **用途**: 数据库名称
- **默认值**: `license_server`
- **代码位置**:
  - `src/config/database.js:9,29` - 指定连接的数据库
  - `src/tools/fix-created-at.js:11` - 迁移工具数据库
  - `config.js:21` - 配置模块数据库名
- **说明**: 存储用户、激活码、会话等核心数据

#### `DB_USER`
- **用途**: 数据库用户名
- **默认值**: `root`
- **代码位置**:
  - `src/config/database.js:10,30` - 数据库连接用户
  - `src/tools/fix-created-at.js:12` - 迁移工具用户
  - `config.js:22` - 配置模块用户
- **说明**: 生产环境建议创建专用数据库用户

#### `DB_PASSWORD` / `DB_PASS`
- **用途**: 数据库密码
- **默认值**: `4693090li` (开发环境)
- **代码位置**:
  - `src/config/database.js:11,31` - 数据库连接密码
  - `src/tools/fix-created-at.js:13` - 迁移工具密码  
  - `config.js:23` - 配置模块密码
- **说明**: ⚠️ 生产环境必须修改为强密码

### Redis配置

#### `REDIS_HOST`
- **用途**: Redis服务器主机地址
- **默认值**: `localhost`
- **代码位置**:
  - `config.js:10` - Redis连接配置中的host字段
- **说明**: Docker部署时使用容器名`redis`

#### `REDIS_PORT`
- **用途**: Redis服务端口
- **默认值**: `6379`
- **代码位置**:
  - `config.js:11` - Redis连接配置中的port字段
- **说明**: Redis标准端口

#### `REDIS_PASSWORD`
- **用途**: Redis连接密码
- **默认值**: `123456` (开发环境)
- **代码位置**:
  - `config.js:12` - Redis连接配置中的password字段
- **说明**: 生产环境必须使用强密码

#### `REDIS_DB`
- **用途**: Redis数据库编号
- **默认值**: `0`
- **代码位置**:
  - `config.js:13` - Redis连接配置中的db字段
- **说明**: 用于隔离不同应用的数据

### 安全配置

#### `JWT_SECRET`
- **用途**: JWT token签名密钥
- **默认值**: `your-super-secret-jwt-key-change-in-production`
- **代码位置**:
  - `config.js:43` - JWT配置中的密钥
  - `src/services/userService.js` - JWT token生成和验证
- **说明**: ⚠️ 必须与pool-backend保持一致，生产环境使用长随机字符串

#### `JWT_EXPIRES_IN`
- **用途**: JWT token过期时间
- **默认值**: `7d`
- **代码位置**:
  - `config.js:44` - JWT过期时间配置
- **说明**: 支持格式：`7d`, `24h`, `3600s`

#### `LICENSE_SECRET`
- **用途**: 许可证签名密钥
- **默认值**: `default-secret-key`
- **代码位置**:
  - `src/services/activation.js:709` - 生成许可证签名
- **说明**: 用于激活码签名验证，防止伪造

#### `TOKEN_ENCRYPTION_KEY`
- **用途**: Token加密密钥
- **默认值**: `default-key-change-in-production`
- **代码位置**:
  - `src/services/tokenPoolService.js:12` - Token池加密
- **说明**: 用于加密存储的token，提高安全性

### 邮件服务配置

#### `SMTP_HOST`
- **用途**: SMTP邮件服务器地址
- **默认值**: `smtp.163.com`
- **代码位置**:
  - `src/services/emailService.js:17` - 邮件发送配置
- **说明**: 支持163、QQ、Gmail等邮箱服务

#### `SMTP_PORT`
- **用途**: SMTP服务端口
- **默认值**: `465`
- **代码位置**:
  - `src/services/emailService.js:18` - 邮件服务端口
- **说明**: 465为SSL加密端口，587为TLS端口

#### `SMTP_USER`
- **用途**: 发送邮件的邮箱地址
- **默认值**: `你的163邮箱地址`
- **代码位置**:
  - `src/services/emailService.js:21` - 邮件发送者
- **说明**: 需要开启SMTP服务的邮箱

#### `SMTP_PASS`
- **用途**: 邮箱SMTP授权码
- **默认值**: `你的163邮箱授权码`
- **代码位置**:
  - `src/services/emailService.js:22` - 邮件发送密码
- **说明**: ⚠️ 不是邮箱登录密码，是SMTP专用授权码

### 服务间通信配置

#### `POOL_BACKEND_URL`
- **用途**: Pool后端服务地址
- **默认值**: `http://localhost:3457`
- **代码位置**:
  - `src/routes/poolProxy.js:13` - 代理到pool-backend的请求
- **说明**: 用于activation-backend调用pool-backend服务

#### `CLAUDE_PROXY_DOMAIN`
- **用途**: Claude代理域名
- **默认值**: `claude-mirror.yourdomain.com`
- **代码位置**:
  - `src/routes/claudeUsers.js:283` - Claude用户服务
  - `src/routes/claudeProxy.js:38` - Claude代理服务
- **说明**: Claude镜像站点域名

### 清理服务配置

#### `CLEANUP_INTERVAL`
- **用途**: 清理服务执行间隔（毫秒）
- **默认值**: `3600000` (1小时)
- **代码位置**:
  - 后台清理服务定时器间隔
- **说明**: 控制过期数据清理频率

#### `CLEANUP_EXPIRED_CODES`
- **用途**: 是否清理过期激活码
- **默认值**: `true`
- **代码位置**:
  - 清理服务配置
- **说明**: 自动清理过期的激活码

#### `CLEANUP_EXPIRED_SESSIONS`
- **用途**: 是否清理过期会话
- **默认值**: `true`
- **代码位置**:
  - 清理服务配置
- **说明**: 自动清理过期的用户会话

#### `CLEANUP_OLD_LOGS`
- **用途**: 是否清理旧日志
- **默认值**: `true`
- **代码位置**:
  - 清理服务配置
- **说明**: 自动清理过期的操作日志

---

## 🚀 pool-backend 环境变量

### 基础应用配置

#### `NODE_ENV`
- **用途**: 应用运行环境
- **默认值**: `development`
- **代码位置**:
  - `src/middleware/security.ts:20` - 安全中间件配置
  - `src/routes/health.ts:45` - 健康检查环境信息
  - `src/server.ts:223` - 生产环境特殊配置
- **说明**: 影响安全策略和错误处理方式

#### `PORT`
- **用途**: 服务监听端口
- **默认值**: `8787`
- **代码位置**:
  - `src/server.ts:55` - 服务启动端口
  - `src/config/app.ts:29` - 应用配置端口
- **说明**: Claude池管理服务端口

### 管理员配置

#### `ADMIN_PASSWORD`
- **用途**: 管理员登录密码
- **默认值**: 生成随机密码并在控制台显示
- **代码位置**:
  - `src/server.ts:56-60` - 管理员密码配置
  - `src/config/app.ts:30-34` - 应用配置中的密码
- **说明**: ⚠️ 生产环境必须设置强密码

### Claude服务配置

#### `BASE_URL`
- **用途**: Claude服务基础URL
- **默认值**: `https://claude.lqqmail.xyz`
- **代码位置**:
  - `src/server.ts:61` - Claude服务地址
  - `src/config/app.ts:35` - 应用配置中的基础URL
- **说明**: Claude API的基础访问地址

#### `CLAUDE_BASE_URL`
- **用途**: Claude服务基础URL（别名）
- **默认值**: `https://claude.ai`
- **代码位置**:
  - `src/auth/tokenService.ts:10` - Token服务中的Claude地址
- **说明**: 与BASE_URL功能相同，用于不同模块

#### `TOKEN_EXPIRES_IN`
- **用途**: Token过期时间（秒）
- **默认值**: `0` (不过期)
- **代码位置**:
  - `src/server.ts:62` - Token过期配置
  - `src/config/app.ts:36` - 应用配置中的过期时间
- **说明**: 设置为0表示token不过期，建议设置为86400（24小时）

### 数据库配置

#### `DB_HOST`
- **用途**: MySQL数据库主机
- **默认值**: `localhost`
- **代码位置**:
  - `src/server.ts:63` - 数据库连接主机
  - `src/config/app.ts:37` - 配置模块主机
- **说明**: 数据库服务器地址

#### `DB_PORT`
- **用途**: MySQL数据库端口
- **默认值**: `3306`
- **代码位置**:
  - `src/server.ts:64` - 数据库连接端口
  - `src/config/app.ts:38` - 配置模块端口
- **说明**: MySQL标准端口

#### `DB_USER`
- **用途**: 数据库用户名
- **默认值**: `root`
- **代码位置**:
  - `src/server.ts:65` - 数据库连接用户
  - `src/config/app.ts:39` - 配置模块用户
- **说明**: 数据库连接用户

#### `DB_PASSWORD`
- **用途**: 数据库密码
- **默认值**: 生成随机密码并在控制台显示
- **代码位置**:
  - `src/server.ts:66-69` - 数据库连接密码
  - `src/config/app.ts:40-43` - 配置模块密码
- **说明**: ⚠️ 生产环境必须设置强密码

#### `DB_NAME`
- **用途**: 数据库名称
- **默认值**: `claudehub`
- **代码位置**:
  - `src/server.ts:70` - 连接的数据库名
  - `src/config/app.ts:44` - 配置模块数据库名
- **说明**: 存储Claude账号和使用记录

#### `DB_CONNECTION_LIMIT`
- **用途**: 数据库连接池大小
- **默认值**: `10`
- **代码位置**:
  - `src/server.ts:71` - 连接池限制
  - `src/config/app.ts:45` - 配置模块连接池
- **说明**: 控制并发数据库连接数量

#### `DB_ACQUIRE_TIMEOUT`
- **用途**: 获取连接超时时间（毫秒）
- **默认值**: `60000` (60秒)
- **代码位置**:
  - `src/server.ts:72` - 连接获取超时
  - `src/config/app.ts:46` - 配置模块超时
- **说明**: 获取数据库连接的最大等待时间

#### `DB_TIMEOUT`
- **用途**: 连接超时时间（毫秒）
- **默认值**: `60000` (60秒)
- **代码位置**:
  - `src/server.ts:73` - 连接超时配置
  - `src/config/app.ts:47` - 配置模块超时
- **说明**: 数据库连接的超时时间

### 安全配置

#### `JWT_SECRET`
- **用途**: JWT签名密钥
- **默认值**: `your-secret-key-change-in-production`
- **代码位置**:
  - `src/auth/tokenService.ts:8` - JWT token签名和验证
- **说明**: ⚠️ 必须与activation-backend保持一致

#### `LICENSE_SERVER_URL`
- **用途**: License服务器地址
- **默认值**: `http://localhost:8888`
- **代码位置**:
  - `src/auth/tokenService.ts:9` - 连接activation-backend服务
- **说明**: 用于验证用户token和获取用户信息

### 版本信息

#### `npm_package_version`
- **用途**: 应用版本号
- **默认值**: `1.0.0`
- **代码位置**:
  - `src/routes/health.ts:44` - 健康检查返回版本信息
- **说明**: 用于API版本标识和健康检查

---

## 🖥️ claude-frontend 环境变量

### API配置

#### `VITE_ACTIVATION_API_URL`
- **用途**: 激活码后端API地址
- **默认值**: `http://localhost:8888`
- **代码位置**:
  - `src/config/api.js:8` - API配置中的license服务器地址
  - `src/config/api.js:26` - 健康检查API地址
  - `src/api/apiClient.js:6` - Axios客户端baseURL
- **说明**: 连接activation-backend服务的地址

#### `VITE_CLAUDE_POOL_API_URL`
- **用途**: Claude Pool后端API地址
- **默认值**: `http://localhost:8787`
- **代码位置**:
  - `src/config/api.js:9` - API配置中的claude pool地址
  - `src/config/api.js:37` - 健康检查API地址
  - `src/api/apiClient.js:15` - Axios客户端baseURL
  - `src/views/Dashboard.vue:685,864` - Dashboard组件中的API调用
- **说明**: 连接pool-backend服务的地址

### 应用信息

#### `VITE_APP_NAME`
- **用途**: 应用名称
- **默认值**: `Claude License System`
- **代码位置**:
  - 应用标题和品牌显示
- **说明**: 在界面中显示的应用名称

#### `VITE_APP_VERSION`
- **用途**: 应用版本
- **默认值**: `1.0.0`
- **代码位置**:
  - 版本信息显示
- **说明**: 应用版本标识

### 开发配置

#### `VITE_ENABLE_CONSOLE`
- **用途**: 是否启用控制台输出
- **默认值**: `true` (开发), `false` (生产)
- **代码位置**:
  - `src/utils/logger.js:9` - 控制台日志开关
- **说明**: 控制前端调试信息输出

#### `VITE_ENABLE_DEBUG`
- **用途**: 是否启用调试模式
- **默认值**: `true` (开发), `false` (生产)
- **代码位置**:
  - 调试功能开关
- **说明**: 控制调试功能的启用

### 环境标识

#### `VITE_MODE`
- **用途**: 构建模式
- **默认值**: `development`
- **代码位置**:
  - `src/config/api.js:10` - 环境标识
  - `src/utils/logger.js:7` - 日志模式判断
- **说明**: 区分开发和生产环境

---

## 🛠️ claude-manager 环境变量

### API配置

#### `VITE_ACTIVATION_API_URL`
- **用途**: 激活码后端API地址
- **默认值**: `http://localhost:8888`
- **代码位置**:
  - `src/api/apiClient.js:6` - 激活码API客户端
- **说明**: 管理激活码的后端服务地址

#### `VITE_CLAUDE_POOL_API_URL`
- **用途**: Claude Pool后端API地址
- **默认值**: `http://localhost:8787`
- **代码位置**:
  - `src/api/apiClient.js:24` - Claude Pool API客户端
  - `src/views/ClaudeManager.vue:60` - Claude管理页面
  - `src/components/claude/ClaudeQuickLogin.vue:212` - 快速登录组件
- **说明**: 管理Claude账号池的后端服务地址

### 应用信息

#### `VITE_APP_NAME`
- **用途**: 应用名称
- **默认值**: `Claude Manager`
- **代码位置**:
  - 管理界面标题显示
- **说明**: 管理员界面的应用名称

#### `VITE_APP_VERSION`
- **用途**: 应用版本
- **默认值**: `1.0.0`
- **代码位置**:
  - 版本信息显示
- **说明**: 管理界面版本标识

### 开发配置

#### `VITE_ENABLE_CONSOLE`
- **用途**: 是否启用控制台输出
- **默认值**: `true` (开发), `false` (生产)
- **代码位置**:
  - 控制台日志开关
- **说明**: 控制管理界面调试信息

#### `VITE_ENABLE_DEBUG`
- **用途**: 是否启用调试模式
- **默认值**: `true` (开发), `false` (生产)
- **代码位置**:
  - 调试功能开关
- **说明**: 控制管理界面调试功能

---

## 🔄 环境变量间的关系

### JWT密钥一致性
- `activation-backend.JWT_SECRET` 必须等于 `pool-backend.JWT_SECRET`
- 用于token在两个服务间的验证

### 服务间通信
- `activation-backend.POOL_BACKEND_URL` → `pool-backend`
- `pool-backend.LICENSE_SERVER_URL` → `activation-backend`

### 前端API地址
- `claude-frontend.VITE_ACTIVATION_API_URL` → `activation-backend`
- `claude-frontend.VITE_CLAUDE_POOL_API_URL` → `pool-backend`
- `claude-manager.VITE_ACTIVATION_API_URL` → `activation-backend`
- `claude-manager.VITE_CLAUDE_POOL_API_URL` → `pool-backend`

### 数据库配置
- `activation-backend` 连接 `license_server` 数据库
- `pool-backend` 连接 `claudehub` 数据库
- 两个服务可以使用相同的MySQL实例但不同的数据库

---

## ⚠️ 安全注意事项

### 生产环境必须修改的变量：
1. `JWT_SECRET` - 两个后端必须使用相同的强密钥
2. `LICENSE_SECRET` - 激活码签名密钥
3. `TOKEN_ENCRYPTION_KEY` - Token加密密钥
4. `DB_PASSWORD` - 数据库密码
5. `REDIS_PASSWORD` - Redis密码
6. `SMTP_PASS` - 邮箱授权码

### 敏感信息存储：
- 所有包含敏感信息的 `.env` 文件都被 `.gitignore` 忽略
- 只有模板文件（`.env.development`, `.env.production`）会被提交到Git
- 部署时需要复制模板文件并修改敏感信息

### 配置验证：
- 启动时检查必需的环境变量
- 生产环境检查密钥强度
- 数据库连接验证
- Redis连接验证
