#!/usr/bin/env tsx
/**
 * 健康检查脚本
 * 用于检查应用和数据库的健康状态
 */

import { PrismaClient } from '@prisma/client'

async function healthCheck() {
  const prisma = new PrismaClient()
  
  try {
    // 测试数据库连接
    await prisma.$connect()
    
    // 执行简单查询测试
    await prisma.admin.count()
    
    console.log('✓ 健康检查通过')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ 健康检查失败:', error)
    process.exit(1)
    
  } finally {
    await prisma.$disconnect()
  }
}

healthCheck()