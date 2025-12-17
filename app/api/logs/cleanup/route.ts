import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { translateForRequest } from '@/lib/translations'

const prisma = new PrismaClient()

/**
 * 清理旧日志
 * @description 删除指定天数之前的日志记录，保持数据库性能
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<{ success: boolean; deletedCount: number } | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days')
    const days = daysParam ? parseInt(daysParam) : 30 // 默认删除30天前的日志

    if (days < 1) {
      return NextResponse.json({ error: translateForRequest(request, 'invalidRequestParams') }, { status: 400 })
    }

    // 计算截止日期
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // 删除旧日志
    const result = await prisma.log.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count
    })

  } catch (error) {
    console.error('清理日志失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}