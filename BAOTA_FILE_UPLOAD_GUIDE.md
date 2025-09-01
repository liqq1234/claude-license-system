# 🚀 宝塔部署文件清单

## 📋 概述

将Claude License System部署到宝塔服务器时，你需要上传以下文件和文件夹。**不是所有文件都需要上传**，只需要上传运行时必需的文件。

---

## ✅ 必须上传的文件和文件夹

### 1. 🏗️ **项目核心文件**
```
claude-project/
├── docker-compose.yml          # ✅ Docker编排文件
├── .env                        # ✅ 环境变量配置（从.env.template复制并修改）
├── deploy-baota.sh             # ✅ 部署脚本
└── README.md                   # ✅ 项目说明（可选）
```

### 2. 🔧 **后端服务源码**
```
claude-backend/
├── activation-backend/         # ✅ 激活码后端服务
│   ├── src/                   # ✅ 源代码目录
│   ├── database/              # ✅ 数据库初始化脚本
│   ├── package.json           # ✅ 依赖配置
│   ├── Dockerfile             # ✅ Docker构建文件
│   ├── config.js              # ✅ 配置文件
│   ├── index.js               # ✅ 入口文件
│   └── sample.*.pem           # ✅ 示例证书文件
│
└── pool-backend/              # ✅ Claude池管理后端
    ├── src/                   # ✅ 源代码目录
    ├── database/              # ✅ 数据库初始化脚本
    ├── package.json           # ✅ 依赖配置
    ├── Dockerfile             # ✅ Docker构建文件
    └── tsconfig.json          # ✅ TypeScript配置
```

### 3. 🖥️ **前端项目源码**
```
claude-frontend/               # ✅ 用户前端界面
├── src/                      # ✅ 源代码目录
├── public/                   # ✅ 静态资源
├── package.json              # ✅ 依赖配置
├── Dockerfile                # ✅ Docker构建文件
├── vite.config.js           # ✅ Vite配置
├── index.html               # ✅ 入口HTML
└── .env.production          # ✅ 生产环境配置

claude-manager/               # ✅ 管理员界面
├── src/                     # ✅ 源代码目录
├── package.json             # ✅ 依赖配置
├── Dockerfile               # ✅ Docker构建文件
├── vite.config.js          # ✅ Vite配置
├── index.html              # ✅ 入口HTML
└── .env.production         # ✅ 生产环境配置
```

### 4. 📚 **文档文件（推荐）**
```
├── BAOTA_DEPLOYMENT_GUIDE.md    # ✅ 宝塔部署指南
├── DEPLOYMENT_VARIABLES_CHECKLIST.md  # ✅ 环境变量清单
├── ENV_CONFIGURATION_GUIDE.md  # ✅ 环境配置指南
└── .env.template               # ✅ 配置模板
```

---

## ❌ 不需要上传的文件和文件夹

### 1. 🚫 **本地开发文件**
```
❌ node_modules/                # 依赖包（Docker构建时会安装）
❌ .git/                       # Git版本控制（使用git clone）
❌ .vscode/                    # VS Code配置
❌ .idea/                      # IDE配置
❌ *.log                       # 日志文件
❌ *.tmp                       # 临时文件
```

### 2. 🚫 **构建产物**
```
❌ claude-frontend/dist/        # 前端构建产物（Docker构建时生成）
❌ claude-manager/dist/         # 管理器构建产物（Docker构建时生成）
❌ claude-backend/pool-backend/dist/  # 后端构建产物（Docker构建时生成）
```

### 3. 🚫 **环境相关文件**
```
❌ .env                        # 本地环境变量（服务器上需要重新配置）
❌ .env.local                  # 本地环境变量
❌ *.env.development.local     # 本地开发环境变量
```

### 4. 🚫 **证书和密钥文件**
```
❌ *.pem                       # 私钥文件（安全考虑）
❌ *.key                       # 密钥文件
❌ ssl/                        # SSL证书目录
```

---

## 📤 推荐的上传方式

### 方式1：使用Git克隆（推荐）
```bash
# 在宝塔服务器上执行
cd /www/wwwroot
git clone https://github.com/liqq1234/claude-license-system.git your-domain.com
cd your-domain.com
git checkout deployment-config
```

**优点**：
- 自动获取所有必需文件
- 易于更新
- 保持文件结构完整

### 方式2：压缩包上传
1. **在本地创建部署包**：
```bash
# 创建部署目录
mkdir claude-deploy
cd claude-deploy

# 复制必需文件
cp -r ../claude-project/claude-backend ./
cp -r ../claude-project/claude-frontend ./
cp -r ../claude-project/claude-manager ./
cp ../claude-project/docker-compose.yml ./
cp ../claude-project/.env.template ./
cp ../claude-project/deploy-baota.sh ./
cp ../claude-project/*.md ./

# 创建压缩包
tar -czf claude-deploy.tar.gz *
```

2. **上传到宝塔服务器**：
   - 使用宝塔文件管理器上传压缩包
   - 解压到网站目录

### 方式3：使用宝塔的Git拉取功能
1. 在宝塔面板添加网站
2. 使用Git拉取功能
3. 仓库地址：`https://github.com/liqq1234/claude-license-system.git`
4. 分支：`deployment-config`

---

## 🗂️ 服务器目录结构

上传完成后，宝塔服务器上的目录结构应该是：

```
/www/wwwroot/your-domain.com/
├── docker-compose.yml
├── .env                       # 从.env.template复制并修改
├── deploy-baota.sh
├── BAOTA_DEPLOYMENT_GUIDE.md
├── DEPLOYMENT_VARIABLES_CHECKLIST.md
├── ENV_CONFIGURATION_GUIDE.md
├── .env.template
├── claude-backend/
│   ├── activation-backend/
│   └── pool-backend/
├── claude-frontend/
└── claude-manager/
```

---

## 🔧 部署后的配置步骤

### 1. 配置环境变量
```bash
cd /www/wwwroot/your-domain.com
cp .env.template .env
nano .env  # 修改配置
```

### 2. 设置执行权限
```bash
chmod +x deploy-baota.sh
chmod +x claude-backend/activation-backend/index.js
```

### 3. 创建数据库
```sql
-- 在宝塔MySQL中执行
CREATE DATABASE license_server CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE claudehub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动服务
```bash
./deploy-baota.sh
```

---

## 📊 文件大小估算

**完整项目大小**（不包含node_modules）：
- 源代码：~50MB
- 文档：~2MB
- 配置文件：~1MB
- **总计：~53MB**

**压缩后大小**：~15-20MB

---

## ⚠️ 重要提醒

1. **不要上传node_modules目录**（太大，且不必要）
2. **不要上传.git目录**（如果使用压缩包方式）
3. **不要上传包含真实密码的.env文件**
4. **确保.env文件在服务器上重新配置**
5. **上传前检查Dockerfile是否存在**

---

## 🚀 快速部署命令

如果使用Git方式（推荐）：
```bash
# 1. 克隆项目
git clone https://github.com/liqq1234/claude-license-system.git your-domain.com

# 2. 切换分支
cd your-domain.com
git checkout deployment-config

# 3. 配置环境
cp .env.template .env
nano .env

# 4. 启动服务
chmod +x deploy-baota.sh
./deploy-baota.sh
```
