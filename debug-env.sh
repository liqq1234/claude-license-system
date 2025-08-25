#!/bin/bash

echo "=== Docker 环境变量调试 ==="

echo "1. 检查本地 .env 文件："
if [ -f ".env" ]; then
    echo "✅ .env 文件存在"
    echo "前端API配置:"
    grep "FRONTEND_.*API_URL" .env || echo "❌ 未找到前端API配置"
    echo "管理器API配置:"
    grep "MANAGER_.*API_URL" .env || echo "❌ 未找到管理器API配置"
else
    echo "❌ .env 文件不存在"
fi

echo ""
echo "2. 检查 claude-frontend 容器环境变量："
docker exec claude-frontend-dev env | grep VITE_ || echo "❌ 容器未运行或环境变量未设置"

echo ""
echo "3. 检查 claude-manager 容器环境变量："
docker exec claude-manager-dev env | grep VITE_ || echo "❌ 容器未运行或环境变量未设置"

echo ""
echo "4. 检查容器状态："
docker-compose ps

echo ""
echo "5. 检查端口占用："
echo "激活后端 (8888):"
netstat -tln | grep :8888 || echo "❌ 端口8888未监听"
echo "池管理后端 (8787):"
netstat -tln | grep :8787 || echo "❌ 端口8787未监听"
