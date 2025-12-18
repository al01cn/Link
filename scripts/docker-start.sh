#!/bin/bash

# Docker 启动脚本
# 用于简化 Docker 部署流程

set -e

echo "🐳 灵狼Link Docker 部署脚本"
echo "================================"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env.local" ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env.local
    echo "⚠️  请编辑 .env.local 文件配置您的环境变量"
    echo "   特别是 ENCRYPTION_KEY 和 NEXT_PUBLIC_BASE_URL"
    read -p "按回车键继续..."
fi

# 选择数据库类型
echo ""
echo "请选择数据库类型："
echo "1) SQLite (默认，适合小型部署)"
echo "2) PostgreSQL (推荐，适合生产环境)"
read -p "请输入选择 (1-2): " db_choice

case $db_choice in
    1)
        echo "🗄️  使用 SQLite 数据库"
        COMPOSE_FILES="docker-compose.yml"
        ;;
    2)
        echo "🐘 使用 PostgreSQL 数据库"
        COMPOSE_FILES="docker-compose.yml docker-compose.postgres.yml"
        ;;
    *)
        echo "使用默认 SQLite 数据库"
        COMPOSE_FILES="docker-compose.yml"
        ;;
esac

# 构建并启动服务
echo ""
echo "🚀 构建并启动服务..."
docker-compose -f $COMPOSE_FILES up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 初始化数据库
echo "🗄️  初始化数据库..."
docker-compose exec app bun run setup

echo ""
echo "✅ 部署完成！"
echo "🌐 访问地址: http://localhost:3000"
echo "👤 默认管理员账户:"
echo "   用户名: Loooong"
echo "   密码: Loooong123"
echo ""
echo "📝 管理命令:"
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo ""
echo "⚠️  首次登录后请立即修改默认密码！"