# 🚀 Claude项目 Monorepo 使用指南

## 📁 项目结构
```
MyProject/
├── pnpm-workspace.yaml     # pnpm workspace配置
├── package.json            # 根目录package.json
├── claude-frontend/        # 前端项目
├── claude-manager/         # 管理界面
├── claude-backend/
│   ├── pool-backend/       # 池管理后端
│   └── activation-backend/ # 激活码后端
└── scripts/               # 工具脚本
```

## 🛠️ 安装和使用

### 1. 首次安装
```bash
# 安装pnpm (如果还没安装)
npm install -g pnpm

# 安装所有依赖 (只会在根目录创建一个node_modules)
pnpm install
```

### 2. 开发命令

#### 启动单个项目
```bash
# 启动后端服务
pnpm start:backend

# 启动前端管理界面
pnpm start:frontend

# 启动指定项目
pnpm --filter claude-pool-manager dev
pnpm --filter activation-monitor dev
```

#### 同时启动多个项目
```bash
# 同时启动后端和前端
pnpm start:all
```

#### 构建项目
```bash
# 构建所有项目
pnpm build:all

# 构建指定项目
pnpm --filter claude-pool-manager build
pnpm --filter activation-monitor build
```

### 3. 依赖管理

#### 添加依赖
```bash
# 给指定项目添加依赖
pnpm --filter claude-pool-manager add express
pnpm --filter activation-monitor add vue

# 添加开发依赖
pnpm --filter claude-pool-manager add -D typescript
```

#### 删除依赖
```bash
pnpm --filter claude-pool-manager remove express
```

### 4. 清理命令
```bash
# 清理所有node_modules
pnpm clean:win

# 重新安装
pnpm install
```

## 🎯 优势

### ✅ 解决的问题
1. **空间节省**: 只有一个根目录node_modules，节省大量磁盘空间
2. **依赖共享**: 相同版本的包会被共享，避免重复下载
3. **统一管理**: 一个命令管理所有子项目
4. **快速安装**: pnpm的链接机制，安装速度更快

### 📊 效果对比
```
之前: 每个项目都有node_modules
claude-frontend/node_modules/     (~200MB)
claude-manager/node_modules/      (~200MB)  
claude-backend/pool-backend/node_modules/ (~100MB)
总计: ~500MB

现在: 只有根目录有node_modules
node_modules/                     (~250MB)
总计: ~250MB (节省50%空间)
```

## 🔧 故障排除

### 问题1: pnpm命令不存在
```bash
npm install -g pnpm
```

### 问题2: 项目启动失败
```bash
# 清理并重新安装
pnpm clean:win
pnpm install
```

### 问题3: 依赖版本冲突
```bash
# 查看依赖树
pnpm list

# 更新依赖
pnpm update
```

## 📝 常用命令速查

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装所有依赖 |
| `pnpm start:backend` | 启动后端 |
| `pnpm start:frontend` | 启动前端 |
| `pnpm start:all` | 启动所有服务 |
| `pnpm build:all` | 构建所有项目 |
| `pnpm clean:win` | 清理node_modules |
| `pnpm --filter <项目名> <命令>` | 对指定项目执行命令 |

## 🎉 开始使用

1. 运行 `pnpm install` 安装依赖
2. 运行 `pnpm start:all` 启动所有服务
3. 享受更快的开发体验！
