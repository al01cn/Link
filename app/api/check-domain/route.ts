import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractDomain, checkDomainAccessServer } from '@/lib/utils'
import { translateForRequest } from '@/lib/translations'

// 检查域名访问权限
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: translateForRequest(request, 'apiMissingUrlParam') }, { status: 400 })
    }

    // 提取域名
    const domain = extractDomain(url)
    if (!domain) {
      return NextResponse.json({ error: translateForRequest(request, 'invalidUrlFormat') }, { status: 400 })
    }

    // 获取系统设置
    const securitySetting = await prisma.setting.findUnique({
      where: { key: 'security_mode' }
    })
    const securityMode = securitySetting?.value || 'blacklist'
    
    // 获取域名规则
    const domainRules = await prisma.domainRule.findMany({
      where: { active: true }
    })
    
    // 检查域名访问权限
    const accessCheck = await checkDomainAccessServer(domain, securityMode, domainRules)
    
    return NextResponse.json({
      allowed: accessCheck.allowed,
      reason: accessCheck.reason,
      domain,
      securityMode
    })

  } catch (error) {
    console.error('检查域名访问权限失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}