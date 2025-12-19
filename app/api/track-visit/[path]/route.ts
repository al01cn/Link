import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Logger from '@/lib/logger'
import { useTranslation } from '@/lib/translations'

/**
 * 记录访问统计 - 在用户真正跳转到目标链接时调用
 * @description 这个API在用户即将跳转到目标链接时被调用，用于准确统计访问次数
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string }> }
) {
  // 获取语言偏好
  const acceptLanguage = request.headers.get('accept-language') || 'zh'
  const language = acceptLanguage.includes('en') ? 'en' : 'zh'
  const t = useTranslation(language)
  
  try {
    const { path } = await params

    // 查找短链
    const shortLink = await prisma.shortLink.findUnique({
      where: { path }
    })

    if (!shortLink) {
      return NextResponse.json({ error: t('apiLinkNotFound') }, { status: 404 })
    }

    // 检查是否过期
    if (shortLink.expiresAt && shortLink.expiresAt < new Date()) {
      return NextResponse.json({ error: t('apiLinkExpired') }, { status: 410 })
    }

    // 记录访问统计
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''

    await Promise.all([
      // 增加访问次数
      prisma.shortLink.update({
        where: { id: shortLink.id },
        data: { views: { increment: 1 } }
      }),
      // 记录访问日志
      prisma.visitLog.create({
        data: {
          shortId: shortLink.id,
          ip: clientIP,
          userAgent,
          referer
        }
      }),
      // 记录系统日志
      Logger.logVisit(path, shortLink.originalUrl, Logger.extractRequestContext(request))
    ])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(t('trackVisitFailed') + ':', error)
    await Logger.logError(error as Error, Logger.extractRequestContext(request))
    return NextResponse.json({ error: t('apiServerError') }, { status: 500 })
  }
}