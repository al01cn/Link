import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { translateForRequest } from '@/lib/translations'
import Logger, { LogType, LogLevel, LogCategory, RiskLevel } from '@/lib/logger'

const prisma = new PrismaClient()

/**
 * 企业级日志条目接口
 */
interface EnhancedLogEntry {
  id: string
  type: string
  level: string
  category: string
  message: string
  messageKey?: string
  messageParams?: string
  details?: any
  stackTrace?: string
  ip?: string
  userAgent?: string
  referer?: string
  requestId?: string
  sessionId?: string
  userId?: string
  username?: string
  action?: string
  resource?: string
  method?: string
  endpoint?: string
  statusCode?: number
  responseTime?: number
  riskLevel: string
  tags?: string[]
  createdAt: string
}

/**
 * 日志查询参数接口
 */
interface LogQueryParams {
  type?: string
  level?: string
  category?: string
  riskLevel?: string
  startDate?: string
  endDate?: string
  search?: string
  ip?: string
  userId?: string
  action?: string
  resource?: string
  method?: string
  statusCode?: number
  tags?: string
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 获取企业级系统日志
 * @description 支持时间范围筛选、多维度搜索、高级过滤等企业级功能
 */
export async function GET(request: NextRequest): Promise<NextResponse<{
  logs: EnhancedLogEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
} | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url)
    
    // 解析查询参数
    const params: LogQueryParams = {
      type: searchParams.get('type') || undefined,
      level: searchParams.get('level') || undefined,
      category: searchParams.get('category') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      ip: searchParams.get('ip') || undefined,
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resource: searchParams.get('resource') || undefined,
      method: searchParams.get('method') || undefined,
      statusCode: searchParams.get('statusCode') ? parseInt(searchParams.get('statusCode')!) : undefined,
      tags: searchParams.get('tags') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 200), // 限制最大返回数量
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }
    
    // 添加excludeType参数支持
    const excludeType = searchParams.get('excludeType')

    const offset = (params.page - 1) * params.limit

    // 构建复杂查询条件
    const where: any = {}

    // 基础筛选
    if (params.type) where.type = params.type
    if (excludeType) where.type = { not: excludeType } // 排除指定类型
    if (params.level) where.level = params.level
    if (params.category) where.category = params.category
    if (params.riskLevel) where.riskLevel = params.riskLevel
    if (params.ip) where.ip = { contains: params.ip }
    if (params.userId) where.userId = params.userId
    if (params.action) where.action = { contains: params.action }
    if (params.resource) where.resource = { contains: params.resource }
    if (params.method) where.method = params.method
    if (params.statusCode) where.statusCode = params.statusCode

    // 时间范围筛选
    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate)
      }
      if (params.endDate) {
        // 结束日期包含当天的23:59:59
        const endDate = new Date(params.endDate)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    // 全文搜索
    if (params.search) {
      const searchTerm = params.search.toLowerCase()
      where.OR = [
        { message: { contains: searchTerm } },
        { messageKey: { contains: searchTerm } },
        { action: { contains: searchTerm } },
        { resource: { contains: searchTerm } },
        { endpoint: { contains: searchTerm } },
        { username: { contains: searchTerm } },
        { ip: { contains: searchTerm } },
        { userAgent: { contains: searchTerm } }
      ]
    }

    // 标签筛选
    if (params.tags) {
      where.tags = { contains: params.tags }
    }

    // 构建排序条件
    const orderBy: any = {}
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder
    }

    // 执行查询
    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        orderBy,
        take: params.limit,
        skip: offset,
      }),
      prisma.log.count({ where })
    ])

    // 转换为响应格式
    const logEntries: EnhancedLogEntry[] = logs.map(log => ({
      id: log.id,
      type: log.type,
      level: log.level,
      category: log.category,
      message: log.messageKey || '', // 使用messageKey作为默认消息
      messageKey: log.messageKey || undefined,
      messageParams: log.messageParams || undefined,
      details: log.details ? JSON.parse(log.details) : null,
      stackTrace: log.stackTrace || undefined,
      ip: log.ip || undefined,
      userAgent: log.userAgent || undefined,
      referer: log.referer || undefined,
      requestId: log.requestId || undefined,
      sessionId: log.sessionId || undefined,
      userId: log.userId || undefined,
      username: log.username || undefined,
      action: log.action || undefined,
      resource: log.resource || undefined,
      method: log.method || undefined,
      endpoint: log.endpoint || undefined,
      statusCode: log.statusCode || undefined,
      responseTime: log.responseTime || undefined,
      riskLevel: log.riskLevel,
      tags: log.tags ? JSON.parse(log.tags) : undefined,
      createdAt: log.createdAt.toISOString(),
    }))

    const totalPages = Math.ceil(total / params.limit)

    return NextResponse.json({
      logs: logEntries,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    })

  } catch (error) {
    console.error('获取日志失败:', error)
    await Logger.logError(error as Error, Logger.extractRequestContext(request))
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}

/**
 * 记录企业级日志
 * @description 使用新的日志系统记录结构化日志
 */
export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const body = await request.json()
    const {
      type,
      level,
      category,
      message,
      messageKey,
      messageParams,
      details,
      action,
      resource,
      riskLevel,
      tags,
      userId,
      username
    } = body

    if (!type || !message) {
      return NextResponse.json({ error: translateForRequest(request, 'invalidRequestParams') }, { status: 400 })
    }

    // 获取请求上下文
    const context = Logger.extractRequestContext(request)

    // 使用新的日志系统记录
    await Logger.log({
      type: type as LogType,
      level: level as LogLevel,
      category: category as LogCategory,
      messageKey: messageKey || message || 'unknownMessage',
      messageParams,
      details,
      action,
      resource,
      riskLevel: riskLevel as RiskLevel,
      tags,
      userId,
      username
    }, context)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('记录日志失败:', error)
    await Logger.logError(error as Error, Logger.extractRequestContext(request))
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}