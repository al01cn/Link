# 多阶段构建优化 Docker 镜像
# 阶段1: 依赖安装
FROM node:22-alpine AS deps

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat

# 设置工作目录
WORKDIR /app

# 安装 Bun
RUN npm install -g bun

# 复制依赖文件
COPY package.json bun.lock* ./

# 安装生产依赖
RUN bun install --frozen-lockfile --production=false

# 阶段2: 构建阶段
FROM node:22-alpine AS builder

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat

# 设置工作目录
WORKDIR /app

# 安装 Bun
RUN npm install -g bun

# 从依赖阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码和配置文件
COPY . .

# 生成 Prisma 客户端
RUN bun run db:generate

# 构建应用（使用优化构建）
RUN bun run build:optimize

# 阶段3: 生产运行时
FROM node:22-alpine AS runner

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat curl

# 设置工作目录
WORKDIR /app

# 安装 Bun
RUN npm install -g bun

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock* ./

# 复制构建产物（standalone 模式）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 Prisma 相关文件
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 复制优化脚本
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib

# 创建数据目录并设置权限
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data && chmod 755 /app/data
RUN mkdir -p /app/logs && chown -R nextjs:nodejs /app/logs && chmod 755 /app/logs

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV DATABASE_URL="file:/app/data/database.db"

# 复制数据库修复脚本和启动脚本
COPY --from=builder /app/scripts/fix-database-deployment.ts ./scripts/
COPY --from=builder /app/scripts/docker-entrypoint.sh ./scripts/

# 设置启动脚本权限
RUN chmod +x ./scripts/docker-entrypoint.sh

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 使用启动脚本
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["bun", "run", "start:prod"]