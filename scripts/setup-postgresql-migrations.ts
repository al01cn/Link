#!/usr/bin/env tsx

/**
 * 为 PostgreSQL 部署设置迁移文件
 * 这个脚本会清理现有的 SQLite 迁移并为 PostgreSQL 创建新的迁移
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('🚀 开始设置 PostgreSQL 迁移...')

  // 1. 设置 PostgreSQL schema
  console.log('📝 设置 PostgreSQL schema...')
  const sourceFile = path.join(process.cwd(), 'prisma', 'schema.postgresql.prisma')
  const targetFile = path.join(process.cwd(), 'prisma', 'schema.prisma')
  
  if (!fs.existsSync(sourceFile)) {
    console.error('❌ PostgreSQL schema 文件不存在')
    process.exit(1)
  }
  
  fs.copyFileSync(sourceFile, targetFile)
  console.log('✅ PostgreSQL schema 已设置')

  // 2. 备份现有迁移文件夹
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations')
  const backupDir = path.join(process.cwd(), 'prisma', 'migrations-sqlite-backup')
  
  if (fs.existsSync(migrationsDir)) {
    console.log('📦 备份现有 SQLite 迁移文件...')
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true })
    }
    fs.renameSync(migrationsDir, backupDir)
    console.log('✅ SQLite 迁移文件已备份到 migrations-sqlite-backup')
  }

  // 3. 生成 Prisma 客户端
  console.log('🔧 生成 Prisma 客户端...')
  try {
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma 客户端已生成')
  } catch (error) {
    console.error('❌ 生成 Prisma 客户端失败:', error)
    process.exit(1)
  }

  console.log('')
  console.log('🎉 PostgreSQL 迁移设置完成！')
  console.log('')
  console.log('📋 接下来的步骤：')
  console.log('1. 确保你的 Vercel 环境变量已正确设置：')
  console.log('   - DATABASE_PROVIDER=postgresql')
  console.log('   - DATABASE_URL=你的PostgreSQL连接字符串')
  console.log('')
  console.log('2. 在 Vercel 中添加构建命令：')
  console.log('   Build Command: bun run build:vercel')
  console.log('')
  console.log('3. 重新部署到 Vercel')
}

main().catch((error) => {
  console.error('❌ 设置失败:', error)
  process.exit(1)
})