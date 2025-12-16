import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import SafeRedirectClient from './SafeRedirectClient'

interface PageProps {
  params: { path: string }
}

export default async function ShortLinkPage({ params }: PageProps) {
  const { path } = params

  try {
    // 查找短链
    const shortLink = await prisma.shortLink.findUnique({
      where: { path }
    })

    if (!shortLink) {
      notFound()
    }

    // 检查是否过期
    if (shortLink.expiresAt && shortLink.expiresAt < new Date()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[--color-bg-surface]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">链接已过期</h1>
            <p className="text-slate-500">此短链已过期，无法访问。</p>
          </div>
        </div>
      )
    }

    // 如果不需要任何中间页面，直接跳转
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
      />
    )

  } catch (error) {
    console.error('访问短链失败:', error)
    notFound()
  }
}