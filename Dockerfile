# 使用官方 Node.js 22 Alpine 镜像作为基础镜像
FROM node:22-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat

# 设置工作目录
WORKDIR /app

# 安装 Bun
RUN npm install -g bun

# 复制 package.json 和 bun.lockb
COPY package.json bun.lockb* ./

# 安装依赖
RUN bun install --frozen-lockfile

# 复制 Prisma schema
COPY prisma ./prisma/

# 生成 Prisma 客户端
RUN bun run db:generate

# 复制源代码
COPY . .

# 构建 Next.js 应用
RUN bun run build

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 设置正确的权限
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["bun", "run", "start"]