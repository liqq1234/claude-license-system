# 生产环境构建脚本
Write-Host "🚀 开始构建生产环境..." -ForegroundColor Green

# 清理之前的构建
if (Test-Path "dist") {
    Write-Host "🧹 清理之前的构建文件..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist"
}

# 设置生产环境变量
$env:NODE_ENV = "production"
$env:VITE_MODE = "production"

Write-Host "📦 开始构建..." -ForegroundColor Blue

# 执行构建
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 生产环境构建完成！" -ForegroundColor Green
    Write-Host "📁 构建文件位于 dist/ 目录" -ForegroundColor Cyan
    
    # 显示构建文件大小
    if (Test-Path "dist") {
        Write-Host "📊 构建文件信息:" -ForegroundColor Cyan
        Get-ChildItem -Path "dist" -Recurse | Where-Object { !$_.PSIsContainer } | 
        ForEach-Object { 
            $size = [math]::Round($_.Length / 1KB, 2)
            Write-Host "  $($_.Name): ${size} KB" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "❌ 构建失败！" -ForegroundColor Red
    exit 1
}
