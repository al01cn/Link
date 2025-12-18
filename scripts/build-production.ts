#!/usr/bin/env tsx
/**
 * 生产环境构建脚本
 * 清空 dist 目录并将构建产物复制到 dist 目录
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const nextDir = path.join(rootDir, '.next')

async function buildProduction() {
console.log('🚀 开始生产环境构建...\n')

// 1. 清空 dist 目录
console.log('📁 清空 dist 目录...')
if (fs.existsSync(distDir)) {
  try {
    // 在 Windows 上可能需要多次尝试
    let retries = 3
    while (retries > 0) {
      try {
        fs.rmSync(distDir, { recursive: true, force: true })
        break
      } catch (error: any) {
        if (error.code === 'EBUSY' && retries > 1) {
          console.log('  目录被占用，等待 2 秒后重试...')
          await new Promise(resolve => setTimeout(resolve, 2000))
          retries--
        } else {
          throw error
        }
      }
    }
    console.log('✓ dist 目录已清空\n')
  } catch (error) {
    console.error('❌ 清空 dist 目录失败:', error)
    console.log('请手动删除 dist 目录后重试')
    process.exit(1)
  }
}
fs.mkdirSync(distDir, { recursive: true })

// 2. 清空并重新初始化数据库
console.log('🗄️ 重新初始化数据库...')
try {
  // 删除现有数据库文件
  const dbFiles = ['dev.db', 'dev.db-journal', 'dev.db-wal']
  dbFiles.forEach(file => {
    const dbPath = path.join(rootDir, file)
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
      console.log(`  ✓ 删除 ${file}`)
    }
  })

  // 重新生成 Prisma 客户端
  console.log('  - 生成 Prisma 客户端...')
  execSync('bunx prisma generate', { 
    stdio: 'inherit',
    cwd: rootDir 
  })

  // 推送数据库模式
  console.log('  - 推送数据库模式...')
  execSync('bunx prisma db push', { 
    stdio: 'inherit',
    cwd: rootDir 
  })

  // 初始化数据库数据
  console.log('  - 初始化数据库数据...')
  execSync('bun run db:init', { 
    stdio: 'inherit',
    cwd: rootDir 
  })

  console.log('✓ 数据库初始化完成\n')
} catch (error) {
  console.error('❌ 数据库初始化失败:', error)
  process.exit(1)
}

// 3. 执行 Next.js 构建
console.log('🔨 执行 Next.js 构建...')
try {
  execSync('bun run build', { 
    stdio: 'inherit',
    cwd: rootDir 
  })
  console.log('✓ Next.js 构建完成\n')
} catch (error) {
  console.error('❌ 构建失败:', error)
  process.exit(1)
}

// 4. 复制必要文件到 dist 目录
console.log('📦 复制构建产物到 dist 目录...')

// 复制 .next 目录
console.log('  - 复制 .next 目录...')
copyDirectory(nextDir, path.join(distDir, '.next'))

// 复制 public 目录
const publicDir = path.join(rootDir, 'public')
if (fs.existsSync(publicDir)) {
  console.log('  - 复制 public 目录...')
  copyDirectory(publicDir, path.join(distDir, 'public'))
}

// 复制 package.json
console.log('  - 复制 package.json...')
fs.copyFileSync(
  path.join(rootDir, 'package.json'),
  path.join(distDir, 'package.json')
)

// 复制 prisma 目录
const prismaDir = path.join(rootDir, 'prisma')
if (fs.existsSync(prismaDir)) {
  console.log('  - 复制 prisma 目录...')
  copyDirectory(prismaDir, path.join(distDir, 'prisma'))
}

// 复制 next.config.ts
console.log('  - 复制 next.config.ts...')
fs.copyFileSync(
  path.join(rootDir, 'next.config.ts'),
  path.join(distDir, 'next.config.ts')
)

// 创建启动脚本
console.log('  - 创建启动脚本...')
const startScript = `#!/usr/bin/env node
/**
 * 生产环境启动脚本
 */

const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 启动生产服务器...')

const nextStart = spawn('node', ['node_modules/next/dist/bin/next', 'start'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
})

nextStart.on('error', (error) => {
  console.error('❌ 启动失败:', error)
  process.exit(1)
})

nextStart.on('exit', (code) => {
  if (code !== 0) {
    console.error(\`❌ 服务器退出，代码: \${code}\`)
    process.exit(code)
  }
})
`

fs.writeFileSync(path.join(distDir, 'start.js'), startScript)
fs.chmodSync(path.join(distDir, 'start.js'), '755')

// 创建 README
console.log('  - 创建 README...')
const readme = `# 生产环境部署包

## 部署说明

### 1. 安装依赖
\`\`\`bash
bun install --production
\`\`\`

### 2. 配置环境变量
复制 .env.example 到 .env 并配置：
\`\`\`bash
cp .env.example .env
\`\`\`

### 3. 初始化数据库
\`\`\`bash
bunx prisma generate
bunx prisma db push
bun run db:init
\`\`\`

### 4. 启动服务
\`\`\`bash
# 使用 Node.js
node start.js

# 或使用 Bun
bun start.js

# 或使用 PM2
pm2 start start.js --name link-app
\`\`\`

## 环境要求
- Node.js 18+ 或 Bun 1.0+
- 内存：最少 512MB
- 磁盘：最少 1GB

## 端口配置
默认端口：3000
可通过环境变量 PORT 修改

## 健康检查
\`\`\`bash
curl http://localhost:3000/api/health
\`\`\`
`

fs.writeFileSync(path.join(distDir, 'README.md'), readme)

// 复制环境变量示例
const envExample = path.join(rootDir, '.env.example')
if (fs.existsSync(envExample)) {
  console.log('  - 复制 .env.example...')
  fs.copyFileSync(envExample, path.join(distDir, '.env.example'))
}

console.log('✓ 文件复制完成\n')

// 5. 为生产环境创建干净的数据库
console.log('�️ 为部生产环境准备干净的数据库...')
const prodDbPath = path.join(distDir, 'data')
fs.mkdirSync(prodDbPath, { recursive: true })

// 创建生产环境的环境变量文件
const prodEnvContent = `# 生产环境配置
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
ENCRYPTION_KEY="your-secret-encryption-key-here"
NODE_ENV="production"

# 性能优化配置
DB_MAX_CONNECTIONS=10
DB_CONNECTION_TIMEOUT=5000
DB_IDLE_TIMEOUT=300000
CACHE_TTL=300000

# Cloudflare Turnstile 人机验证配置
NEXT_PUBLIC_TURNSTILE_SITE_KEY="3x00000000000000000000FF"
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
`

fs.writeFileSync(path.join(distDir, '.env'), prodEnvContent)
console.log('✓ 生产环境配置文件已创建\n')

// 6. 生成部署信息
console.log('📝 生成部署信息...')
const buildInfo = {
  buildTime: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  nextVersion: require('../package.json').dependencies.next
}

fs.writeFileSync(
  path.join(distDir, 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
)

console.log('✓ 部署信息已生成\n')

// 5. 显示构建结果
console.log('✅ 生产环境构建完成！\n')
console.log('📦 构建产物位置:', distDir)
console.log('📊 构建信息:')
console.log(`   - 构建时间: ${buildInfo.buildTime}`)
console.log(`   - Node 版本: ${buildInfo.nodeVersion}`)
console.log(`   - Next.js 版本: ${buildInfo.nextVersion}`)
console.log('\n🚀 部署步骤:')
console.log('   1. 将 dist 目录上传到服务器')
console.log('   2. 在 dist 目录中运行: bun install --production')
console.log('   3. 配置环境变量: cp .env.example .env')
console.log('   4. 初始化数据库: bunx prisma generate && bunx prisma db push && bun run db:init')
console.log('   5. 启动服务: node start.js 或 bun start.js')
console.log('\n💡 提示: 可以使用 PM2 管理进程: pm2 start start.js --name link-app\n')

}

// 辅助函数：递归复制目录
function copyDirectory(src: string, dest: string) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  源目录不存在: ${src}`)
    return
  }

  fs.mkdirSync(dest, { recursive: true })
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// 执行构建
buildProduction().catch(error => {
  console.error('❌ 构建过程出错:', error)
  process.exit(1)
})
