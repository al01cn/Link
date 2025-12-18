#!/bin/bash
# 快速部署修复脚本
# 解决 Linux 服务器上的数据库连接问题

set -e

echo "🚀 [开始] 快速部署修复脚本"
echo "=========================================="

# 1. 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ [错误] 请在项目根目录运行此脚本"
    exit 1
fi

# 2. 创建必要的目录
echo "📁 [创建] 创建必要的目录..."
mkdir -p data logs
chmod 755 data logs
echo "  ✓ 目录创建完成"

# 3. 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "📝 [配置] 创建环境变量文件..."
    cp .env.example .env
    echo "  ✓ 请编辑 .env 文件设置正确的配置"
fi

# 4. 安装依赖
echo "📦 [安装] 安装项目依赖..."
if command -v bun &> /dev/null; then
    bun install
else
    echo "⚠️  [警告] 未找到 bun，使用 npm 安装..."
    npm install
fi
echo "  ✓ 依赖安装完成"

# 5. 运行数据库修复
echo "🔧 [修复] 运行数据库修复脚本..."
if command -v bun &> /dev/null; then
    bun run db:fix
else
    npm run db:fix
fi
echo "  ✓ 数据库修复完成"

# 6. 初始化数据库
echo "📊 [初始化] 初始化数据库..."
if command -v bun &> /dev/null; then
    bun run db:init
else
    npm run db:init
fi
echo "  ✓ 数据库初始化完成"

# 7. 运行健康检查
echo "🔍 [检查] 运行健康检查..."
if command -v bun &> /dev/null; then
    bun run health:check
else
    npm run health:check
fi
echo "  ✓ 健康检查通过"

# 8. 显示完成信息
echo ""
echo "🎉 [完成] 部署修复完成！"
echo "=========================================="
echo ""
echo "📋 [信息] 修复详情:"
echo "   ✓ 数据目录已创建并设置权限"
echo "   ✓ 数据库连接问题已修复"
echo "   ✓ 数据库已初始化"
echo "   ✓ 健康检查通过"
echo ""
echo "🚀 [启动] 现在可以启动应用:"
if command -v bun &> /dev/null; then
    echo "   开发环境: bun run dev"
    echo "   生产环境: bun run start:prod"
else
    echo "   开发环境: npm run dev"
    echo "   生产环境: npm run start:prod"
fi
echo ""
echo "🔐 [登录] 默认管理员账号:"
echo "   用户名: Loooong"
echo "   密码: Loooong123"
echo "   ⚠️  首次登录后请立即修改密码"
echo ""