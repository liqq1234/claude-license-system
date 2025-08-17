# 生产环境构建指南

## 概述

本项目已配置为支持生产环境模式，在生产环境中会自动禁用所有控制台输出和调试信息。

## 构建命令

### 开发环境构建
```bash
npm run dev          # 启动开发服务器
npm run build:dev    # 构建开发版本（保留调试信息）
```

### 生产环境构建
```bash
npm run build        # 构建生产版本（移除所有调试信息）
```

### 使用 PowerShell 脚本构建
```powershell
.\build-production.ps1
```

## 环境配置

### 开发环境 (.env.development)
- 启用所有控制台输出
- 启用调试模式
- 详细的错误信息

### 生产环境 (.env.production)
- 禁用控制台输出
- 禁用调试模式
- 优化的错误处理

## 主要改进

1. **日志管理**: 创建了 `src/utils/logger.js` 统一管理日志输出
2. **环境区分**: 通过环境变量控制功能开关
3. **构建优化**: Vite 配置自动移除生产环境中的 console 和 debugger
4. **代码清理**: 替换所有 console 语句为 logger 调用

## 文件修改列表

- `vite.config.js` - 添加生产环境优化配置
- `src/utils/logger.js` - 新增日志管理工具
- `src/views/Dashboard.vue` - 替换 console 为 logger
- `src/api/claude-pool.js` - 替换 console 为 logger  
- `src/stores/auth.js` - 替换 console 为 logger
- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置

## 验证生产构建

构建完成后，可以通过以下方式验证：

1. 检查 `dist/` 目录中的文件
2. 使用 `npm run preview` 预览生产版本
3. 在浏览器开发者工具中确认没有调试输出

## 注意事项

- 生产环境中不会显示任何 console 输出
- 错误仍会被记录，但不会显示详细的调试信息
- ElMessage 等用户提示功能正常工作
- 所有功能保持不变，只是移除了调试输出
