import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 添加域名规则
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, type } = body
    
    if (!domain || !type) {
      return NextResponse.json({ error: '域名和类型不能为空' }, { status: 400 })
    }
    
    // 验证域名格式
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: '无效的域名格式' }, { status: 400 })
    }
    
    // 检查是否已存在
    const existing = await prisma.domainRule.findUnique({
      where: { domain }
    })
    
    if (existing) {
      // 如果存在但类型不同，更新类型
      if (existing.type !== type) {
        const updated = await prisma.domainRule.update({
          where: { domain },
          data: { type, active: true }
        })
        return NextResponse.json(updated)
      } else {
        return NextResponse.json({ error: '域名已存在' }, { status: 400 })
      }
    }
    
    // 创建新规则
    const domainRule = await prisma.domainRule.create({
      data: {
        domain,
        type,
        active: true
      }
    })
    
    return NextResponse.json(domainRule)
  } catch (error) {
    console.error('添加域名规则失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}