import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { translateForRequest } from '@/lib/translations'
import Logger from '@/lib/logger'

const prisma = new PrismaClient()

/**
 * 导出日志数据
 * @description 支持 CSV 和 JSON 格式导出，用于审计和分析
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    
    const format = searchParams.get('format') || 'csv' // csv | json
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const level = searchParams.get('level')
    const category = searchParams.get('category')
    const riskLevel = searchParams.get('riskLevel')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10000'), 50000) // 限制导出数量

    // 构建查询条件
    const where: any = {}
    
    if (type) where.type = type
    if (level) where.level = level
    if (category) where.category = category
    if (riskLevel) where.riskLevel = riskLevel

    // 时间范围筛选
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDateTime
      }
    }

    // 查询日志数据
    const logs = await prisma.log.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // 记录导出操作
    await Logger.logAdmin(
      'export_logs',
      `logs:${format}`,
      Logger.extractRequestContext(request),
      {
        format,
        filters: { type, level, category, riskLevel, startDate, endDate },
        recordCount: logs.length
      }
    )

    if (format === 'json') {
      // JSON 格式导出
      const jsonData = logs.map(log => ({
        id: log.id,
        type: log.type,
        level: log.level,
        category: log.category,
        messageKey: log.messageKey,
        messageParams: log.messageParams,
        details: log.details,
        stackTrace: log.stackTrace,
        ip: log.ip,
        userAgent: log.userAgent,
        referer: log.referer,
        requestId: log.requestId,
        sessionId: log.sessionId,
        userId: log.userId,
        username: log.username,
        action: log.action,
        resource: log.resource,
        method: log.method,
        endpoint: log.endpoint,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        riskLevel: log.riskLevel,
        tags: log.tags,
        createdAt: log.createdAt.toISOString(),
      }))

      const filename = `logs_${new Date().toISOString().split('T')[0]}.json`
      
      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } else {
      // CSV 格式导出
      const csvHeaders = [
        'ID', '类型', '级别', '分类', '消息键', '消息参数', '操作', '资源', 'IP地址', 
        '用户代理', '方法', '端点', '状态码', '响应时间', '风险级别', 
        '用户ID', '用户名', '创建时间'
      ].join(',')

      const csvRows = logs.map(log => [
        log.id,
        log.type,
        log.level,
        log.category,
        `"${(log.messageKey || '').replace(/"/g, '""')}"`, // 转义双引号
        `"${(log.messageParams || '').replace(/"/g, '""')}"`, // 转义双引号
        log.action || '',
        log.resource || '',
        log.ip || '',
        `"${(log.userAgent || '').replace(/"/g, '""')}"`,
        log.method || '',
        log.endpoint || '',
        log.statusCode || '',
        log.responseTime || '',
        log.riskLevel,
        log.userId || '',
        log.username || '',
        log.createdAt.toISOString()
      ].join(','))

      const csvContent = [csvHeaders, ...csvRows].join('\n')
      const filename = `logs_${new Date().toISOString().split('T')[0]}.csv`

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

  } catch (error) {
    console.error('导出日志失败:', error)
    await Logger.logError(error as Error, Logger.extractRequestContext(request))
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}