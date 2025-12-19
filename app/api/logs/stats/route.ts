import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { translateForRequest } from '@/lib/translations'
import Logger from '@/lib/logger'

const prisma = new PrismaClient()

/**
 * 企业级日志统计接口
 */
interface EnhancedLogStats {
  // 基础统计
  total: number
  todayCount: number
  yesterdayCount: number
  thisWeekCount: number
  thisMonthCount: number
  
  // 按类型统计
  typeStats: Record<string, number>
  
  // 按级别统计
  levelStats: Record<string, number>
  
  // 按分类统计
  categoryStats: Record<string, number>
  
  // 按风险级别统计
  riskLevelStats: Record<string, number>
  
  // 时间趋势
  last24Hours: Array<{
    hour: string
    count: number
    errorCount: number
    securityCount: number
  }>
  
  last7Days: Array<{
    date: string
    count: number
    errorCount: number
    securityCount: number
  }>
  
  // 热点统计
  topIPs: Array<{
    ip: string
    count: number
    riskLevel: string
  }>
  
  topActions: Array<{
    action: string
    count: number
  }>
  
  topResources: Array<{
    resource: string
    count: number
  }>
  
  // 错误统计
  errorTrends: Array<{
    hour: string
    count: number
  }>
  
  // 安全统计
  securityEvents: Array<{
    type: string
    count: number
    riskLevel: string
  }>
  
  // 性能统计
  avgResponseTime: number
  slowRequests: number // 响应时间 > 1000ms 的请求数
}

/**
 * 获取企业级日志统计信息
 * @description 提供全面的日志分析数据，包括趋势、热点、安全事件等
 */
export async function GET(request: NextRequest): Promise<NextResponse<EnhancedLogStats | { error: string }>> {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // 基础统计
    const [
      total,
      todayCount,
      yesterdayCount,
      thisWeekCount,
      thisMonthCount
    ] = await Promise.all([
      prisma.log.count(),
      prisma.log.count({ where: { createdAt: { gte: today } } }),
      prisma.log.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      prisma.log.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.log.count({ where: { createdAt: { gte: monthAgo } } })
    ])

    // 按类型统计
    const typeStatsRaw = await prisma.log.groupBy({
      by: ['type'],
      _count: { type: true }
    })
    const typeStats: Record<string, number> = {}
    typeStatsRaw.forEach(item => {
      typeStats[item.type] = item._count.type
    })

    // 按级别统计
    const levelStatsRaw = await prisma.log.groupBy({
      by: ['level'],
      _count: { level: true }
    })
    const levelStats: Record<string, number> = {}
    levelStatsRaw.forEach(item => {
      levelStats[item.level] = item._count.level
    })

    // 按分类统计
    const categoryStatsRaw = await prisma.log.groupBy({
      by: ['category'],
      _count: { category: true }
    })
    const categoryStats: Record<string, number> = {}
    categoryStatsRaw.forEach(item => {
      categoryStats[item.category] = item._count.category
    })

    // 按风险级别统计
    const riskLevelStatsRaw = await prisma.log.groupBy({
      by: ['riskLevel'],
      _count: { riskLevel: true }
    })
    const riskLevelStats: Record<string, number> = {}
    riskLevelStatsRaw.forEach(item => {
      riskLevelStats[item.riskLevel] = item._count.riskLevel
    })

    // 过去24小时趋势
    const last24Hours = []
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000)
      hourStart.setMinutes(0, 0, 0)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
      
      const [count, errorCount, securityCount] = await Promise.all([
        prisma.log.count({
          where: { createdAt: { gte: hourStart, lt: hourEnd } }
        }),
        prisma.log.count({
          where: { 
            createdAt: { gte: hourStart, lt: hourEnd },
            level: 'error'
          }
        }),
        prisma.log.count({
          where: { 
            createdAt: { gte: hourStart, lt: hourEnd },
            type: 'security'
          }
        })
      ])

      last24Hours.push({
        hour: hourStart.toISOString(),
        count,
        errorCount,
        securityCount
      })
    }

    // 过去7天趋势
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const [count, errorCount, securityCount] = await Promise.all([
        prisma.log.count({
          where: { createdAt: { gte: dayStart, lt: dayEnd } }
        }),
        prisma.log.count({
          where: { 
            createdAt: { gte: dayStart, lt: dayEnd },
            level: 'error'
          }
        }),
        prisma.log.count({
          where: { 
            createdAt: { gte: dayStart, lt: dayEnd },
            type: 'security'
          }
        })
      ])

      last7Days.push({
        date: dayStart.toISOString().split('T')[0],
        count,
        errorCount,
        securityCount
      })
    }

    // 热点IP统计
    const topIPsRaw = await prisma.log.groupBy({
      by: ['ip', 'riskLevel'],
      _count: { ip: true },
      where: {
        ip: { not: null },
        createdAt: { gte: weekAgo }
      },
      orderBy: { _count: { ip: 'desc' } },
      take: 10
    })
    const topIPs = topIPsRaw.map(item => ({
      ip: item.ip!,
      count: item._count.ip,
      riskLevel: item.riskLevel
    }))

    // 热点操作统计
    const topActionsRaw = await prisma.log.groupBy({
      by: ['action'],
      _count: { action: true },
      where: {
        action: { not: null },
        createdAt: { gte: weekAgo }
      },
      orderBy: { _count: { action: 'desc' } },
      take: 10
    })
    const topActions = topActionsRaw.map(item => ({
      action: item.action!,
      count: item._count.action
    }))

    // 热点资源统计
    const topResourcesRaw = await prisma.log.groupBy({
      by: ['resource'],
      _count: { resource: true },
      where: {
        resource: { not: null },
        createdAt: { gte: weekAgo }
      },
      orderBy: { _count: { resource: 'desc' } },
      take: 10
    })
    const topResources = topResourcesRaw.map(item => ({
      resource: item.resource!,
      count: item._count.resource
    }))

    // 错误趋势（过去24小时）
    const errorTrends = []
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000)
      hourStart.setMinutes(0, 0, 0)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
      
      const count = await prisma.log.count({
        where: {
          createdAt: { gte: hourStart, lt: hourEnd },
          level: { in: ['error', 'critical'] }
        }
      })

      errorTrends.push({
        hour: hourStart.toISOString(),
        count
      })
    }

    // 安全事件统计
    const securityEventsRaw = await prisma.log.groupBy({
      by: ['type', 'riskLevel'],
      _count: { type: true },
      where: {
        type: 'security',
        createdAt: { gte: weekAgo }
      }
    })
    const securityEvents = securityEventsRaw.map(item => ({
      type: item.type,
      count: item._count.type,
      riskLevel: item.riskLevel
    }))

    // 性能统计
    const responseTimeStats = await prisma.log.aggregate({
      _avg: { responseTime: true },
      _count: { responseTime: true },
      where: {
        responseTime: { not: null },
        createdAt: { gte: today }
      }
    })

    const slowRequests = await prisma.log.count({
      where: {
        responseTime: { gt: 1000 },
        createdAt: { gte: today }
      }
    })

    const stats: EnhancedLogStats = {
      total,
      todayCount,
      yesterdayCount,
      thisWeekCount,
      thisMonthCount,
      typeStats,
      levelStats,
      categoryStats,
      riskLevelStats,
      last24Hours,
      last7Days,
      topIPs,
      topActions,
      topResources,
      errorTrends,
      securityEvents,
      avgResponseTime: responseTimeStats._avg.responseTime || 0,
      slowRequests
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('获取日志统计失败:', error)
    await Logger.logError(error as Error, Logger.extractRequestContext(request))
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}