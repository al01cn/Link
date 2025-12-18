#!/usr/bin/env tsx
/**
 * 数据库优化脚本
 * 用于优化数据库性能，包括索引创建、数据清理等
 */

import { PrismaClient } from '@prisma/client'
import { queryOptimizer } from '../lib/queryOptimizer'

const prisma = new PrismaClient()

async function optimizeDatabase() {
  console.log('🚀 开始数据库优化...')
  
  try {
    // 1. 创建性能索引
    console.log('📊 创建性能索引...')
    await createPerformanceIndexes()
    
    // 2. 清理过期数据
    console.log('🧹 清理过期数据...')
    await cleanupExpiredData()
    
    // 3. 优化访问日志
    console.log('📝 优化访问日志...')
    await optimizeVisitLogs()
    
    // 4. 分析表统计信息
    console.log('📈 分析表统计信息...')
    await analyzeTableStats()
    
    // 5. 压缩数据库（SQLite）
    console.log('🗜️ 压缩数据库...')
    await compressDatabase()
    
    console.log('✅ 数据库优化完成！')
    
  } catch (error) {
    console.error('❌ 数据库优化失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function createPerformanceIndexes() {
  try {
    // 为短链路径创建唯一索引（如果不存在）
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_shortlink_path ON ShortLink(path)
    `
    
    // 为创建时间创建索引，用于排序查询
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_shortlink_created_at ON ShortLink(createdAt DESC)
    `
    
    // 为访问次数创建索引
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_shortlink_views ON ShortLink(views DESC)
    `
    
    // 为过期时间创建索引
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_shortlink_expires_at ON ShortLink(expiresAt)
    `
    
    // 为访问日志的短链ID创建索引
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_visitlog_shortid ON VisitLog(shortId)
    `
    
    // 为访问日志的创建时间创建索引
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_visitlog_created_at ON VisitLog(createdAt DESC)
    `
    
    // 为系统日志的类型和时间创建复合索引
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_log_type_created_at ON Log(type, createdAt DESC)
    `
    
    console.log('  ✓ 性能索引创建完成')
  } catch (error) {
    console.error('  ✗ 创建索引失败:', error)
  }
}

async function cleanupExpiredData() {
  try {
    // 清理过期的短链
    const expiredLinks = await queryOptimizer.cleanupExpiredLinks()
    console.log(`  ✓ 清理了 ${expiredLinks} 个过期短链`)
    
    // 清理超过30天的访问日志
    const oldVisitLogs = await prisma.visitLog.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天前
        }
      }
    })
    console.log(`  ✓ 清理了 ${oldVisitLogs.count} 条旧访问日志`)
    
    // 清理超过7天的系统日志
    const oldSystemLogs = await prisma.log.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天前
        }
      }
    })
    console.log(`  ✓ 清理了 ${oldSystemLogs.count} 条旧系统日志`)
    
  } catch (error) {
    console.error('  ✗ 清理过期数据失败:', error)
  }
}

async function optimizeVisitLogs() {
  try {
    // 为每个短链只保留最近1000条访问记录
    const shortLinks = await prisma.shortLink.findMany({
      select: { id: true }
    })
    
    let totalCleaned = 0
    
    for (const link of shortLinks) {
      // 获取该短链的访问记录总数
      const totalVisits = await prisma.visitLog.count({
        where: { shortId: link.id }
      })
      
      if (totalVisits > 1000) {
        // 获取要保留的最新1000条记录的最早时间
        const keepLogs = await prisma.visitLog.findMany({
          where: { shortId: link.id },
          orderBy: { createdAt: 'desc' },
          take: 1000,
          select: { createdAt: true }
        })
        
        if (keepLogs.length === 1000) {
          const cutoffTime = keepLogs[999].createdAt
          
          // 删除更早的记录
          const deleted = await prisma.visitLog.deleteMany({
            where: {
              shortId: link.id,
              createdAt: { lt: cutoffTime }
            }
          })
          
          totalCleaned += deleted.count
        }
      }
    }
    
    console.log(`  ✓ 优化访问日志，清理了 ${totalCleaned} 条多余记录`)
    
  } catch (error) {
    console.error('  ✗ 优化访问日志失败:', error)
  }
}

async function analyzeTableStats() {
  try {
    const stats = await queryOptimizer.getDatabaseStats()
    
    console.log('  📊 数据库统计信息:')
    console.log(`    - 总短链数: ${stats.totalLinks}`)
    console.log(`    - 活跃短链数: ${stats.activeLinks}`)
    console.log(`    - 过期短链数: ${stats.expiredLinks}`)
    console.log(`    - 总访问次数: ${stats.totalVisits}`)
    console.log(`    - 平均响应时间: ${stats.avgResponseTime.toFixed(2)}ms`)
    
    // 获取查询统计
    const queryStats = queryOptimizer.getQueryStats()
    console.log('  🔍 查询统计信息:')
    console.log(`    - 总查询次数: ${queryStats.totalQueries}`)
    console.log(`    - 平均执行时间: ${queryStats.avgExecutionTime.toFixed(2)}ms`)
    console.log(`    - 缓存命中率: ${(queryStats.cacheHitRate * 100).toFixed(1)}%`)
    console.log(`    - 慢查询数量: ${queryStats.slowQueries.length}`)
    
  } catch (error) {
    console.error('  ✗ 分析表统计失败:', error)
  }
}

async function compressDatabase() {
  try {
    // SQLite 数据库压缩
    await prisma.$executeRaw`VACUUM`
    console.log('  ✓ 数据库压缩完成')
    
    // 分析表以更新统计信息
    await prisma.$executeRaw`ANALYZE`
    console.log('  ✓ 表统计信息更新完成')
    
  } catch (error) {
    console.error('  ✗ 数据库压缩失败:', error)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  optimizeDatabase()
}