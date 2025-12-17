import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { translateForRequest } from '@/lib/translations'
import { validateDomainRule } from '@/lib/utils'

// 获取域名规则列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'whitelist' | 'blacklist'
    
    const whereClause = type ? { type, active: true } : { active: true }
    
    const domainRules = await prisma.domainRule.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(domainRules)
  } catch (error) {
    console.error('获取域名规则失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}

// 添加域名规则
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, type } = body
    
    if (!domain || !type) {
      return NextResponse.json({ error: translateForRequest(request, 'invalidRequestParams') }, { status: 400 })
    }
    
    // 使用新的域名验证函数
    const validation = validateDomainRule(domain)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    
    const normalizedDomain = validation.normalizedDomain!
    
    // 检查是否已存在
    const existing = await prisma.domainRule.findUnique({
      where: { domain: normalizedDomain }
    })
    
    if (existing) {
      // 如果存在但类型不同，更新类型
      if (existing.type !== type) {
        const updated = await prisma.domainRule.update({
          where: { domain: normalizedDomain },
          data: { type, active: true }
        })
        return NextResponse.json(updated)
      } else {
        return NextResponse.json({ error: '该域名规则已存在' }, { status: 400 })
      }
    }
    
    // 创建新规则
    const domainRule = await prisma.domainRule.create({
      data: {
        domain: normalizedDomain,
        type,
        active: true
      }
    })
    
    return NextResponse.json(domainRule)
  } catch (error) {
    console.error('添加域名规则失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}