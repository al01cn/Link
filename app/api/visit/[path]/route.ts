import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/crypto'
import { logVisit, logError } from '@/lib/logger'
import { useTranslation } from '@/lib/translations'

// 访问短链 - 获取链接信息
export async function GET(
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

    // 返回链接信息（不包含密码）
    return NextResponse.json({
      id: shortLink.id,
      originalUrl: shortLink.originalUrl,
      title: shortLink.title,
      hasPassword: !!shortLink.password,
      requireConfirm: shortLink.requireConfirm,
      enableIntermediate: shortLink.enableIntermediate
    })

  } catch (error) {
    console.error(t('getShortLinkInfoFailed') + ':', error)
    return NextResponse.json({ error: t('apiServerError') }, { status: 500 })
  }
}

// 验证密码并记录访问
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
    const body = await request.json()
    const { password, isAutoFill } = body // 添加 isAutoFill 参数来区分来源

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

    // 验证密码
    if (shortLink.password && !verifyPassword(password || '', shortLink.password, isAutoFill)) {
      return NextResponse.json({ error: t('apiPasswordRequired') }, { status: 401 })
    }

    // 验证通过，但不在这里统计访问
    // 统计将在客户端真正跳转时进行

    return NextResponse.json({
      originalUrl: shortLink.originalUrl,
      title: shortLink.title
    })

  } catch (error) {
    console.error(t('processShortLinkAccessFailed') + ':', error)
    await logError(t('processShortLinkAccessFailed'), error, request)
    return NextResponse.json({ error: t('apiServerError') }, { status: 500 })
  }
}