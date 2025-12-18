# 数据库连接问题修复指南

## 问题描述

在 Linux 服务器上部署时遇到以下错误：
```
数据库连接失败: Error [PrismaClientInitializationError]: Error querying the database: Error code 14: Unable to open the database file
```

## 问题原因

1. **文件权限问题**：数据库文件或目录没有正确的读写权限
2. **路径问题**：相对路径在容器环境中可能不正确
3. **目录不存在**：数据库文件所在的目录不存在

## 解决方案

### 方案一：使用自动修复脚本（推荐）

1. **运行修复脚本**：
   ```bash
   bun run db:fix
   ```

2. **初始化数据库**：
   ```bash
   bun run db:init
   ```

### 方案二：手动修复

1. **检查环境变量**：
   ```bash
   echo $DATABASE_URL
   ```
   确保 `DATABASE_URL` 设置正确，例如：
   ```
   DATABASE_URL="file:/app/data/database.db"
   ```

2. **创建数据目录**：
   ```bash
   mkdir -p /app/data
   chmod 755 /app/data
   ```

3. **设置文件权限**（如果数据库文件已存在）：
   ```bash
   chmod 644 /app/data/database.db
   ```

4. **生成 Prisma 客户端**：
   ```bash
   bunx prisma generate
   ```

5. **推送数据库模式**：
   ```bash
   bunx prisma db push
   ```

6. **初始化数据**：
   ```bash
   bun run db:init
   ```

### 方案三：Docker 部署修复

如果使用 Docker 部署，确保：

1. **数据目录挂载**：
   ```yaml
   # docker-compose.yml
   volumes:
     - ./data:/app/data
   ```

2. **环境变量设置**：
   ```yaml
   environment:
     - DATABASE_URL=file:/app/data/database.db
   ```

3. **重新构建镜像**：
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

## 验证修复

运行健康检查确认数据库连接正常：
```bash
bun run health:check
```

如果看到 "✓ 健康检查通过"，说明问题已解决。

## 预防措施

1. **使用绝对路径**：在生产环境中使用绝对路径而不是相对路径
2. **正确设置权限**：确保应用进程有读写数据库文件的权限
3. **数据持久化**：在 Docker 部署中正确挂载数据卷

## 常见问题

### Q: 修复后仍然报错怎么办？
A: 检查以下几点：
- 确认数据库文件路径是否正确
- 检查文件和目录权限
- 确认 Prisma 客户端已正确生成
- 查看详细错误日志

### Q: Docker 容器中数据丢失怎么办？
A: 确保正确挂载数据卷：
```yaml
volumes:
  - ./data:/app/data
```

### Q: 权限被拒绝错误？
A: 检查文件所有者和权限：
```bash
ls -la /app/data/
chown -R nextjs:nodejs /app/data
chmod 755 /app/data
chmod 644 /app/data/database.db
```

## 技术支持

如果问题仍然存在，请提供以下信息：
1. 完整的错误日志
2. 环境变量配置
3. 文件权限信息：`ls -la /app/data/`
4. 系统信息：`uname -a`