#!/bin/bash

# 短链服务部署脚本

echo "🚀 开始部署 ShortLink 服务..."

# 检查环境
if [ ! -f ".env" ]; then
    echo "❌ 缺少 .env 文件，请先配置环境变量"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
bun install

# 生成 Prisma 客户端
echo "🔧 生成数据库客户端..."
bunx prisma generate

# 推送数据库模式
echo "🗄️ 同步数据库模式..."
bunx prisma db push

# 初始化数据库数据
echo "🌱 初始化数据库数据..."
bun run db:init

# 构建项目
echo "🏗️ 构建项目..."
bun run build

echo "✅ 部署完成！"
echo "🌐 启动服务器: bun run start"