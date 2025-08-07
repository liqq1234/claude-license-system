# 🧹 项目清理脚本
# 用于清理项目中的冗余文件和代码

Write-Host "🧹 开始清理项目..." -ForegroundColor Green

# 1. 清理构建产物
Write-Host "📦 清理构建产物..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "claude-frontend\dist" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "claude-manager\dist" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "claude-frontend\build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "claude-manager\build" -ErrorAction SilentlyContinue

# 2. 清理缓存文件
Write-Host "🗂️ 清理缓存文件..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "claude-frontend\.cache" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "claude-manager\.cache" -ErrorAction SilentlyContinue

# 3. 清理临时文件
Write-Host "🗑️ 清理临时文件..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Include "*.tmp", "*.temp", "*.log" | Remove-Item -Force -ErrorAction SilentlyContinue

# 4. 清理系统文件
Write-Host "💻 清理系统文件..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Include ".DS_Store", "Thumbs.db" | Remove-Item -Force -ErrorAction SilentlyContinue

# 5. 显示清理结果
Write-Host "✅ 清理完成!" -ForegroundColor Green
Write-Host "📊 项目大小统计:" -ForegroundColor Cyan

# 计算各目录大小
$frontendSize = (Get-ChildItem -Recurse "claude-frontend" -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
$managerSize = (Get-ChildItem -Recurse "claude-manager" -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
$backendSize = (Get-ChildItem -Recurse "claude-backend" -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "  前端项目: $([math]::Round($frontendSize, 2)) MB" -ForegroundColor White
Write-Host "  管理界面: $([math]::Round($managerSize, 2)) MB" -ForegroundColor White
Write-Host "  后端服务: $([math]::Round($backendSize, 2)) MB" -ForegroundColor White

Write-Host "`n💡 建议:" -ForegroundColor Cyan
Write-Host "  1. 定期运行此脚本清理项目" -ForegroundColor White
Write-Host "  2. 使用 VSCode 扩展检测代码质量" -ForegroundColor White
Write-Host "  3. 定期检查 node_modules 大小" -ForegroundColor White
