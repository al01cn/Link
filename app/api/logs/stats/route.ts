import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { translateForRequest } from '@/lib/translations'

const prisma = new PrismaClient()

/**
 * 日志统计接口（Log statistics interface）
 */
interface LogStats {
  total: number
  visitCount: number
  createCount: number
  errorCount: number
  todayCount: number
  last24Hours: Array<{
    hour: string
    count: number
  }>
}

/**
 * 获取日志统计信息（Get log statistics）
 * @description 获取日志的统计数据，包括总数、类型分布、今日统计等
 */
export async function GET(request: NextRequest): Promise<NextResponse<LogStats | { error: string }>> {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    // 获取总数统计
    const [total, visitCount, createCount, errorCount, todayCount] = await Promise.all([
      prisma.log.count(),
      prisma.log.count({ where: { type: 'visit' } }),
      prisma.log.count({ where: { type: 'create' } }),
      prisma.log.count({ where: { type: 'error' } }),
      prisma.log.count({ where: { createdAt: { gte: today } } })
    ])

    // 获取过去24小时的统计数据
    const last24Hours = []
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000)
      hourStart.setMinutes(0, 0, 0)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
      
      const count = await prisma.log.count({
        where: {
          createdAt: {
            gte: hourStart,
            lt: hourEnd
          }
        }
      })

      last24Hours.push({
        hour: hourStart.toISOString(),
        count
      })
    }

    const stats: LogStats = {
      total,
      visitCount,
      createCount,
      errorCount,
      todayCount,
      last24Hours
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('获取日志统计失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}