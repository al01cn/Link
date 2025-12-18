#!/usr/bin/env tsx
/**
 * 创建部署压缩包脚本
 * 将 dist 目录打包成可部署的压缩文件
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const buildDir = path.join(rootDir, 'build')
const packageName = `link-app-production-${new Date().toISOString().slice(0, 10)}.tar.gz`
const packagePath = path.join(buildDir, packageName)

console.log('📦 创建部署压缩包...\n')

// 检查 dist 目录是否存在
if (!fs.existsSync(distDir)) {
  console.error('❌ dist 目录不存在，请先运行 bun run build:prod')
  process.exit(1)
}

try {
  // 创建 build 目录
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true })
    console.log('📁 创建 build 目录...')
  }
  
  // 创建压缩包
  console.log('🗜️ 正在压缩 dist 目录...')
  
  // 使用 tar 命令创建压缩包到 build 目录
  execSync(`tar -czf "${packagePath}" -C dist .`, {
    cwd: rootDir,
    stdio: 'inherit'
  })
  
  // 获取文件大小
  const stats = fs.statSync(packagePath)
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
  
  console.log('✅ 部署压缩包创建成功！\n')
  console.log('📊 包信息:')
  console.log(`   - 文件名: ${packageName}`)
  console.log(`   - 大小: ${fileSizeInMB} MB`)
  console.log(`   - 路径: ${packagePath}`)
  
  console.log('\n🚀 部署说明:')
  console.log('1. 将压缩包上传到服务器')
  console.log('2. 解压: tar -xzf ' + packageName)
  console.log('3. 安装依赖: bun install --production')
  console.log('4. 配置环境: cp .env.example .env && 编辑 .env')
  console.log('5. 初始化数据库: bunx prisma generate && bunx prisma db push')
  console.log('6. 启动服务: node start.js 或 pm2 start start.js --name link-app')
  
  console.log('\n💡 提示:')
  console.log('- 确保服务器已安装 Node.js 18+ 或 Bun 1.0+')
  console.log('- 建议使用 PM2 管理进程')
  console.log('- 可通过 /api/health 检查服务状态')
  
} catch (error) {
  console.error('❌ 创建压缩包失败:', error)
  process.exit(1)
}