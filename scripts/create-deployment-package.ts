#!/usr/bin/env tsx
/**
 * 创建部署压缩包脚本
 * 支持两种打包模式：
 * 1. 完整生产包 - 包含所有文件，用于全新部署
 * 2. 更新包 - 仅包含代码和逻辑，不包含数据库文件，用于更新现有部署
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const buildDir = path.join(rootDir, 'build')

// 从命令行参数获取打包类型
const packageType = process.argv[2] || 'full' // 'full' 或 'update'
const dateStr = new Date().toISOString().slice(0, 10)
const packageName = packageType === 'update' 
  ? `link-app-production-${dateStr}-update.tar.gz`
  : `link-app-production-${dateStr}.tar.gz`
const packagePath = path.join(buildDir, packageName)

console.log(`📦 创建${packageType === 'update' ? '更新' : '完整'}部署压缩包...\n`)

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
  
  if (packageType === 'update') {
    // 创建更新包 - 排除数据库文件和敏感数据
    console.log('🗜️ 正在创建更新包（排除数据库文件）...')
    
    // 创建临时目录用于更新包
    const tempDir = path.join(buildDir, 'temp-update')
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
    fs.mkdirSync(tempDir, { recursive: true })
    
    // 复制需要的文件，排除数据库相关文件
    copyDirectoryExcluding(distDir, tempDir, [
      'dev.db',           // SQLite 数据库文件
      'dev.db-journal',   // SQLite 日志文件
      'dev.db-wal',       // SQLite WAL 文件
      'data',             // 数据目录
      '.env',             // 环境配置文件（避免覆盖生产配置）
      'prisma/migrations' // 数据库迁移文件（避免数据冲突）
    ])
    
    // 从临时目录创建压缩包
    execSync(`tar -czf "${packagePath}" -C "${tempDir}" .`, {
      cwd: rootDir,
      stdio: 'inherit'
    })
    
    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true, force: true })
    
  } else {
    // 创建完整包
    console.log('🗜️ 正在压缩完整 dist 目录...')
    
    // 使用 tar 命令创建压缩包到 build 目录
    execSync(`tar -czf "${packagePath}" -C dist .`, {
      cwd: rootDir,
      stdio: 'inherit'
    })
  }
  
  // 获取文件大小
  const stats = fs.statSync(packagePath)
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
  
  console.log(`✅ ${packageType === 'update' ? '更新' : '完整'}部署压缩包创建成功！\n`)
  console.log('📊 包信息:')
  console.log(`   - 类型: ${packageType === 'update' ? '更新包' : '完整包'}`)
  console.log(`   - 文件名: ${packageName}`)
  console.log(`   - 大小: ${fileSizeInMB} MB`)
  console.log(`   - 路径: ${packagePath}`)
  
  if (packageType === 'update') {
    console.log('\n🔄 更新包部署说明:')
    console.log('1. 停止现有服务: pm2 stop link-app')
    console.log('2. 备份当前版本: cp -r /path/to/app /path/to/app-backup')
    console.log('3. 将更新包上传到服务器')
    console.log('4. 解压到应用目录: tar -xzf ' + packageName)
    console.log('5. 安装/更新依赖: bun install --production')
    console.log('6. 重新生成 Prisma 客户端: bunx prisma generate')
    console.log('7. 重启服务: pm2 restart link-app')
    
    console.log('\n⚠️  更新包注意事项:')
    console.log('- 不包含数据库文件，现有数据不会被覆盖')
    console.log('- 不包含 .env 文件，现有配置不会被覆盖')
    console.log('- 不包含 prisma/migrations，避免数据库结构冲突')
    console.log('- 建议在更新前备份整个应用目录')
    
  } else {
    console.log('\n🚀 完整包部署说明:')
    console.log('1. 将压缩包上传到服务器')
    console.log('2. 解压: tar -xzf ' + packageName)
    console.log('3. 安装依赖: bun install --production')
    console.log('4. 配置环境: cp .env.example .env && 编辑 .env')
    console.log('5. 初始化数据库: bunx prisma generate && bunx prisma db push')
    console.log('6. 启动服务: node start.js 或 pm2 start start.js --name link-app')
  }
  
  console.log('\n💡 提示:')
  console.log('- 确保服务器已安装 Node.js 18+ 或 Bun 1.0+')
  console.log('- 建议使用 PM2 管理进程')
  console.log('- 可通过 /api/health 检查服务状态')
  
} catch (error) {
  console.error('❌ 创建压缩包失败:', error)
  process.exit(1)
}

/**
 * 复制目录，排除指定的文件和目录
 */
function copyDirectoryExcluding(src: string, dest: string, excludeList: string[]) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  源目录不存在: ${src}`)
    return
  }

  fs.mkdirSync(dest, { recursive: true })
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  for (const entry of entries) {
    // 检查是否在排除列表中
    if (excludeList.includes(entry.name)) {
      console.log(`  ⏭️  跳过: ${entry.name}`)
      continue
    }
    
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      // 对于 prisma 目录，需要特殊处理
      if (entry.name === 'prisma') {
        copyPrismaDirectory(srcPath, destPath)
      } else {
        copyDirectoryExcluding(srcPath, destPath, excludeList)
      }
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * 复制 Prisma 目录，排除 migrations 文件夹和数据库文件
 */
function copyPrismaDirectory(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  // 需要排除的文件和目录
  const excludeItems = ['migrations', 'dev.db', 'dev.db-journal', 'dev.db-wal']
  
  for (const entry of entries) {
    // 跳过 migrations 目录和数据库文件
    if (excludeItems.includes(entry.name)) {
      console.log(`  ⏭️  跳过: prisma/${entry.name}`)
      continue
    }
    
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDirectoryExcluding(srcPath, destPath, [])
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}