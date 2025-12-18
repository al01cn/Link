#!/usr/bin/env tsx
/**
 * 修复 Linux 服务器部署时的数据库连接问题
 * 解决 "Error code 14: Unable to open the database file" 错误
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

// 加载环境变量
config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '.env.local') })

async function fixDatabaseDeployment() {
  console.log('🔧 [修复] 开始修复数据库部署问题...')
  
  try {
    // 1. 检查并创建数据目录
    const dataDir = path.resolve(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      console.log('📁 [创建] 创建数据目录...')
      fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 })
      console.log('  ✓ 数据目录已创建:', dataDir)
    }

    // 2. 检查数据库 URL 配置
    const databaseUrl = process.env.DATABASE_URL
    console.log('🔍 [检查] 当前数据库 URL:', databaseUrl)
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL 环境变量未设置')
    }

    // 3. 解析数据库文件路径
    let dbFilePath: string
    if (databaseUrl.startsWith('file:')) {
      const filePath = databaseUrl.replace('file:', '')
      if (filePath.startsWith('./')) {
        // 相对路径，转换为绝对路径
        dbFilePath = path.resolve(process.cwd(), filePath.substring(2))
      } else if (filePath.startsWith('/')) {
        // 绝对路径
        dbFilePath = filePath
      } else {
        // 相对路径（无 ./）
        dbFilePath = path.resolve(process.cwd(), filePath)
      }
    } else {
      throw new Error('不支持的数据库 URL 格式，请使用 SQLite file: URL')
    }

    console.log('📍 [路径] 数据库文件路径:', dbFilePath)

    // 4. 确保数据库文件目录存在
    const dbDir = path.dirname(dbFilePath)
    if (!fs.existsSync(dbDir)) {
      console.log('📁 [创建] 创建数据库目录...')
      fs.mkdirSync(dbDir, { recursive: true, mode: 0o755 })
      console.log('  ✓ 数据库目录已创建:', dbDir)
    }

    // 5. 设置目录权限（Linux/Unix 系统）
    if (process.platform !== 'win32') {
      try {
        console.log('🔐 [权限] 设置目录权限...')
        execSync(`chmod 755 "${dbDir}"`)
        console.log('  ✓ 目录权限已设置')
        
        // 如果数据库文件已存在，设置文件权限
        if (fs.existsSync(dbFilePath)) {
          execSync(`chmod 644 "${dbFilePath}"`)
          console.log('  ✓ 数据库文件权限已设置')
        }
      } catch (error) {
        console.warn('⚠️  [警告] 无法设置文件权限:', error)
      }
    }

    // 6. 生成 Prisma 客户端
    console.log('⚙️  [生成] 生成 Prisma 客户端...')
    execSync('bunx prisma generate', { stdio: 'inherit' })
    console.log('  ✓ Prisma 客户端已生成')

    // 7. 推送数据库模式
    console.log('📊 [模式] 推送数据库模式...')
    execSync('bunx prisma db push --force-reset', { stdio: 'inherit' })
    console.log('  ✓ 数据库模式已推送')

    // 8. 测试数据库连接
    console.log('🔌 [测试] 测试数据库连接...')
    const prisma = new PrismaClient()
    
    try {
      await prisma.$connect()
      console.log('  ✓ 数据库连接成功')
      
      // 测试基本查询
      const adminCount = await prisma.admin.count()
      console.log(`  ✓ 数据库查询成功，管理员数量: ${adminCount}`)
      
    } catch (error) {
      console.error('  ❌ 数据库连接失败:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }

    // 9. 显示修复结果
    console.log('')
    console.log('🎉 [完成] 数据库部署问题修复完成！')
    console.log('')
    console.log('📋 [信息] 修复详情:')
    console.log(`   数据库文件: ${dbFilePath}`)
    console.log(`   数据库目录: ${dbDir}`)
    console.log(`   目录权限: 755`)
    console.log(`   文件权限: 644`)
    console.log('')
    console.log('🚀 [下一步] 现在可以运行以下命令初始化数据:')
    console.log('   bun run db:init')
    console.log('')

  } catch (error) {
    console.error('❌ [错误] 修复失败:', error)
    process.exit(1)
  }
}

// 运行修复脚本
if (require.main === module) {
  fixDatabaseDeployment()
}

export default fixDatabaseDeployment