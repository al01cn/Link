import { NextRequest, NextResponse } from 'next/server'
import Logger from '@/lib/logger'
import { useTranslation } from '@/lib/translations'

/**
 * 记录TO模式访问统计
 * @description 记录通过TO模式真正跳转到目标链接的访问统计
 */
export async function POST(request: NextRequest) {
  // 获取语言偏好
  const acceptLanguage = request.headers.get('accept-language') || 'zh'
  const language = acceptLanguage.includes('en') ? 'en' : 'zh'
  const t = useTranslation(language)
  
  try {
    const body = await request.json()
    const { targetUrl, title, type, source } = body

    if (!targetUrl) {
      return NextResponse.json({ error: t('missingTargetUrl') }, { status: 400 })
    }

    // 记录TO模式的真实访问统计
    await Logger.logVisit('to-mode', targetUrl, Logger.extractRequestContext(request))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(t('trackToVisitFailed') + ':', error)
    await Logger.logError(error as Error, Logger.extractRequestContext(request))
    return NextResponse.json({ error: t('apiServerError') }, { status: 500 })
  }
}