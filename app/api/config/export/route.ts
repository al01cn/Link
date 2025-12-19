import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAdminToken } from '@/lib/adminAuth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 验证管理员权限 - 支持URL参数中的token
    let adminPayload = verifyAdminToken(request)
    
    // 如果Header中没有token，尝试从URL参数获取
    if (!adminPayload) {
      const urlToken = searchParams.get('token')
      if (urlToken) {
        // 创建一个临时请求对象来验证URL中的token
        const tempHeaders = new Headers()
        tempHeaders.set('authorization', `Bearer ${urlToken}`)
        const tempRequest = new NextRequest(request.url, {
          headers: tempHeaders
        })
        adminPayload = verifyAdminToken(tempRequest)
      }
    }
    
    if (!adminPayload) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const type = searchParams.get('type') || 'all' // all, settings, links

    const exportData: any = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      type: type
    }

    // 导出系统设置
    if (type === 'all' || type === 'settings') {
      // 获取各个设置项
      const securityMode = await prisma.setting.findUnique({
        where: { key: 'security_mode' }
      })
      const waitTime = await prisma.setting.findUnique({
        where: { key: 'redirect_wait_time' }
      })
      const captchaEnabled = await prisma.setting.findUnique({
        where: { key: 'captcha_enabled' }
      })
      const preloadEnabled = await prisma.setting.findUnique({
        where: { key: 'preload_enabled' }
      })
      const autoFillPasswordEnabled = await prisma.setting.findUnique({
        where: { key: 'auto_fill_password_enabled' }
      })
      
      const domainRules = await prisma.domainRule.findMany()
      
      exportData.settings = {
        securityMode: securityMode?.value || 'blacklist',
        waitTime: parseInt(waitTime?.value || '3'),
        captchaEnabled: captchaEnabled?.value === 'true',
        preloadEnabled: preloadEnabled?.value !== 'false',
        autoFillPasswordEnabled: autoFillPasswordEnabled?.value !== 'false'
      }
      
      exportData.domainRules = domainRules.map(rule => ({
        domain: rule.domain,
        type: rule.type,
        active: rule.active
      }))
    }

    // 导出短链数据
    if (type === 'all' || type === 'links') {
      const links = await prisma.shortLink.findMany({
        orderBy: { createdAt: 'desc' }
      })
      
      exportData.links = links.map(link => ({
        id: link.id, // 导出UUID
        path: link.path,
        originalUrl: link.originalUrl,
        title: link.title,
        description: link.description,
        password: link.password, // 导出加密后的密码
        expiresAt: link.expiresAt?.toISOString(),
        requireConfirm: link.requireConfirm,
        enableIntermediate: link.enableIntermediate,
        views: link.views,
        createdAt: link.createdAt.toISOString()
      }))
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `link-${type}-${timestamp}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('导出配置失败:', error)
    return NextResponse.json({ error: '导出失败' }, { status: 500 })
  }
}