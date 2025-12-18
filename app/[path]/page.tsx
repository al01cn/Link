import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import SafeRedirectClient from './SafeRedirectClient'

// 强制动态渲染，避免预渲染错误
export const dynamic = 'force-dynamic'



interface PageProps {
  params: Promise<{ path: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ShortLinkPage({ params, searchParams }: PageProps) {
  const { path } = await params
  const urlParams = await searchParams
  const pwd = typeof urlParams.pwd === 'string' ? urlParams.pwd : undefined

  try {
    // 查找短链
    const shortLink = await prisma.shortLink.findUnique({
      where: { path }
    })

    if (!shortLink) {
      notFound()
    }

    // 检查是否过期 - 过期的短链返回404
    if (shortLink.expiresAt && shortLink.expiresAt < new Date()) {
      notFound()
    }

    // 直接跳转的条件：没有密码、不需要确认、且禁用了中间页
    if (!shortLink.password && !shortLink.requireConfirm && !shortLink.enableIntermediate) {
      // 记录访问（在服务端）
      await Promise.all([
        prisma.shortLink.update({
          where: { id: shortLink.id },
          data: { views: { increment: 1 } }
        }),
        prisma.visitLog.create({
          data: {
            shortId: shortLink.id,
            ip: 'server-redirect',
            userAgent: 'server',
            referer: ''
          }
        })
      ])
      
      redirect(shortLink.originalUrl)
    }

    // 需要显示中间页面
    return (
      <SafeRedirectClient 
        path={path}
        targetUrl={shortLink.originalUrl}
        title={shortLink.title || undefined}
        hasPassword={!!shortLink.password}
        requireConfirm={shortLink.requireConfirm}
        enableIntermediate={shortLink.enableIntermediate}
        autoFillPassword={pwd}
        expiresAt={shortLink.expiresAt?.toISOString()}
      />
    )

  } catch (error) {
    console.error('访问短链失败:', error)
    notFound()
  }
}