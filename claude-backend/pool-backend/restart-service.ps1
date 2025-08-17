# 重启 Claude Pool Backend 服务脚本
Write-Host "🔄 正在重启 Claude Pool Backend 服务..." -ForegroundColor Blue

# 检查是否安装了 PM2
try {
    $pm2Version = pm2 --version
    Write-Host "✅ PM2 版本: $pm2Version" -ForegroundColor Green
} catch {
    Write-Host "❌ PM2 未安装，请先安装 PM2" -ForegroundColor Red
    Write-Host "安装命令: npm install -g pm2" -ForegroundColor Yellow
    exit 1
}

# 检查服务状态
Write-Host "📊 检查当前服务状态..." -ForegroundColor Cyan
pm2 list

# 重启服务
Write-Host "🔄 重启服务中..." -ForegroundColor Yellow

# 尝试重启已存在的服务
try {
    pm2 restart claude-pool-backend
    Write-Host "✅ 服务重启成功！" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 重启失败，尝试启动新服务..." -ForegroundColor Yellow
    
    # 如果重启失败，尝试启动新服务
    try {
        pm2 start npm --name "claude-pool-backend" -- start
        Write-Host "✅ 服务启动成功！" -ForegroundColor Green
    } catch {
        Write-Host "❌ 服务启动失败！" -ForegroundColor Red
        Write-Host "请检查配置文件和依赖是否正确" -ForegroundColor Yellow
        exit 1
    }
}

# 显示服务状态
Write-Host "📊 当前服务状态:" -ForegroundColor Cyan
pm2 list

# 显示日志
Write-Host "📝 最近的日志:" -ForegroundColor Cyan
pm2 logs claude-pool-backend --lines 10

Write-Host "🎉 服务重启完成！新的 TOKEN_EXPIRES_IN=86400 配置已生效" -ForegroundColor Green
Write-Host "💡 提示: 用户会话现在默认24小时后过期" -ForegroundColor Blue
