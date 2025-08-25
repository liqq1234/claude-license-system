#!/bin/bash

# 宝塔部署启动脚本

echo "🚀 开始部署Claude License System到宝塔..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先在宝塔面板安装Docker管理器"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，正在安装..."
    curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "📝 创建环境变量文件..."
    cp .env.docker .env
    echo "⚠️  请编辑 .env 文件配置你的数据库密码和域名"
    echo "nano .env"
    exit 1
fi

# 停止可能存在的旧容器
echo "🛑 停止旧容器..."
docker-compose down

# 构建并启动服务
echo "🏗️  构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

echo ""
echo "✅ 部署完成！"
echo ""
echo "📍 服务访问地址："
echo "   前端界面: http://localhost:8080"
echo "   管理界面: http://localhost:8081"  
echo "   激活码API: http://localhost:8888"
echo "   Pool API: http://localhost:8787"
echo ""
echo "🌐 请在宝塔面板配置反向代理："
echo "   参考 BAOTA_DEPLOYMENT_GUIDE.md 文档"
echo ""
echo "📊 查看日志: docker-compose logs -f"
echo "🔄 重启服务: docker-compose restart"
echo "🛑 停止服务: docker-compose down"
