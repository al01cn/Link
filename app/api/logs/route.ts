import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { translateForRequest } from '@/lib/translations'

const prisma = new PrismaClient()

/**
 * 日志类型枚举（Log type enumeration）
 */
type LogType = 'visit' | 'create' | 'error' | 'prepare'

/**
 * 日志条目接口（Log entry interface）
 */
interface LogEntry {
  id: string
  type: LogType
  message: string
  details?: any
  ip?: string
  userAgent?: string
  createdAt: string
}

/**
 * 获取系统日志（Get system logs）
 * @description 获取访问日志和短链生成日志，支持分页和类型筛选
 */
export async function GET(request: NextRequest): Promise<NextResponse<LogEntry[] | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as LogType | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // 构建查询条件
    const where = type ? { type } : {}

    // 查询日志
    const logs = await prisma.log.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // 转换为响应格式
    const logEntries: LogEntry[] = logs.map(log => ({
      id: log.id,
      type: log.type as LogType,
      message: log.message,
      details: log.details ? JSON.parse(log.details) : null,
      ip: log.ip || undefined,
      userAgent: log.userAgent || undefined,
      createdAt: log.createdAt.toISOString(),
    }))

    return NextResponse.json(logEntries)

  } catch (error) {
    console.error('获取日志失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}

/**
 * 记录日志（Record log）
 * @description 记录新的日志条目
 */
export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const body = await request.json()
    const { type, message, details } = body

    if (!type || !message) {
      return NextResponse.json({ error: translateForRequest(request, 'invalidRequestParams') }, { status: 400 })
    }

    // 获取客户端信息
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 创建日志记录
    await prisma.log.create({
      data: {
        type,
        message,
        details: details ? JSON.stringify(details) : null,
        ip,
        userAgent,
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('记录日志失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}