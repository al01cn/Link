#!/bin/bash
set -e

echo "🚀 [启动] Docker 容器启动脚本"

# 1. 检查数据目录权限
echo "🔍 [检查] 检查数据目录权限..."
if [ ! -d "/app/data" ]; then
    echo "📁 [创建] 创建数据目录..."
    mkdir -p /app/data
fi

# 确保数据目录权限正确
chmod 755 /app/data
echo "  ✓ 数据目录权限已设置"

# 2. 检查数据库文件是否存在
DB_FILE="/app/data/database.db"
if [ ! -f "$DB_FILE" ]; then
    echo "🔧 [初始化] 数据库文件不存在，开始初始化..."
    
    # 生成 Prisma 客户端
    echo "⚙️  [生成] 生成 Prisma 客户端..."
    bun run db:generate
    
    # 推送数据库模式
    echo "📊 [模式] 推送数据库模式..."
    bun run db:push
    
    # 初始化数据库数据
    echo "📝 [数据] 初始化数据库数据..."
    bun run db:init
    
    echo "  ✓ 数据库初始化完成"
else
    echo "  ✓ 数据库文件已存在: $DB_FILE"
    
    # 确保 Prisma 客户端是最新的
    echo "⚙️  [更新] 更新 Prisma 客户端..."
    bun run db:generate
fi

# 3. 设置数据库文件权限
if [ -f "$DB_FILE" ]; then
    chmod 644 "$DB_FILE"
    echo "  ✓ 数据库文件权限已设置"
fi

# 4. 测试数据库连接
echo "🔌 [测试] 测试数据库连接..."
if bun run health:check > /dev/null 2>&1; then
    echo "  ✓ 数据库连接正常"
else
    echo "  ⚠️  数据库连接测试失败，但继续启动..."
fi

# 5. 启动应用
echo "🎯 [启动] 启动 Next.js 应用..."
exec "$@"