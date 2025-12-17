import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/crypto'
import { logVisit, logError } from '@/lib/logger'

// 访问短链 - 获取链接信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string }> }
) {
  try {
    const { path } = await params
    
    // 查找短链
    const shortLink = await prisma.shortLink.findUnique({
      where: { path }
    })

    if (!shortLink) {
      return NextResponse.json({ error: '短链不存在' }, { status: 404 })
    }

    // 检查是否过期
    if (shortLink.expiresAt && shortLink.expiresAt < new Date()) {
      return NextResponse.json({ error: '短链已过期' }, { status: 410 })
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
    console.error('获取短链信息失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 验证密码并记录访问
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string }> }
) {
  try {
    const { path } = await params
    const body = await request.json()
    const { password } = body

    // 查找短链
    const shortLink = await prisma.shortLink.findUnique({
      where: { path }
    })

    if (!shortLink) {
      return NextResponse.json({ error: '短链不存在' }, { status: 404 })
    }

    // 检查是否过期
    if (shortLink.expiresAt && shortLink.expiresAt < new Date()) {
      return NextResponse.json({ error: '短链已过期' }, { status: 410 })
    }

    // 验证密码
    if (shortLink.password && !verifyPassword(password || '', shortLink.password)) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 })
    }

    // 记录访问日志
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
      logVisit(path, shortLink.originalUrl, request, {
        shortLinkId: shortLink.id,
        title: shortLink.title,
        hasPassword: !!shortLink.password,
        referer
      })
    ])

    return NextResponse.json({
      originalUrl: shortLink.originalUrl,
      title: shortLink.title
    })

  } catch (error) {
    console.error('处理短链访问失败:', error)
    await logError('处理短链访问失败', error, request)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}