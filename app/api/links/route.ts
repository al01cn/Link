import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateShortPath, isValidUrl, fetchPageTitle, extractDomain, checkDomainAccessServer } from '@/lib/utils'
import { encryptPassword } from '@/lib/crypto'
import { logCreate, logError } from '@/lib/logger'

// 创建短链
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      originalUrl, 
      customPath, 
      password, 
      expiresAt, 
      requireConfirm = false,
      enableIntermediate = true 
    } = body

    // 验证URL
    if (!isValidUrl(originalUrl)) {
      return NextResponse.json({ error: '无效的URL格式' }, { status: 400 })
    }

    // 验证自定义路径
    if (customPath) {
      if (!/^[a-zA-Z0-9_-]+$/.test(customPath)) {
        return NextResponse.json({ error: '路径只能包含字母、数字、下划线和连字符' }, { status: 400 })
      }
      if (customPath.length < 3) {
        return NextResponse.json({ error: '路径长度至少3个字符' }, { status: 400 })
      }
      if (customPath.length > 50) {
        return NextResponse.json({ error: '路径长度不能超过50个字符' }, { status: 400 })
      }
    }

    // 检查域名访问权限
    const domain = extractDomain(originalUrl)
    if (domain) {
      // 获取系统设置
      const securitySetting = await prisma.setting.findUnique({
        where: { key: 'security_mode' }
      })
      const securityMode = securitySetting?.value || 'whitelist'
      
      // 获取域名规则
      const domainRules = await prisma.domainRule.findMany({
        where: { active: true }
      })
      
      // 检查域名访问权限
      const accessCheck = await checkDomainAccessServer(domain, securityMode, domainRules)
      if (!accessCheck.allowed) {
        return NextResponse.json({ 
          error: `无法创建短链：${accessCheck.reason}` 
        }, { status: 403 })
      }
    }

    // 检查是否已存在相同的原始URL（防止重复创建）
    const existingUrl = await prisma.shortLink.findFirst({
      where: { originalUrl }
    })
    
    if (existingUrl) {
      return NextResponse.json({ 
        error: '该链接已存在短链',
        existingLink: {
          id: existingUrl.id,
          path: existingUrl.path,
          shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${existingUrl.path}`
        }
      }, { status: 409 })
    }

    // 生成或使用自定义路径
    let path = customPath || generateShortPath()
    
    // 检查路径是否已存在
    const existing = await prisma.shortLink.findUnique({
      where: { path }
    })
    
    if (existing) {
      if (customPath) {
        return NextResponse.json({ error: '自定义路径已存在' }, { status: 400 })
      }
      // 如果是随机生成的路径冲突，重新生成
      path = generateShortPath()
    }

    // 尝试获取页面标题
    const title = await fetchPageTitle(originalUrl)

    // 加密密码（如果有的话）
    const encryptedPassword = password ? encryptPassword(password) : null

    // 创建短链记录
    const shortLink = await prisma.shortLink.create({
      data: {
        path,
        originalUrl,
        title,
        password: encryptedPassword,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        requireConfirm,
        enableIntermediate
      }
    })

    // 记录创建日志
    await logCreate(shortLink.path, originalUrl, request, {
      shortLinkId: shortLink.id,
      title,
      hasPassword: !!password,
      requireConfirm,
      enableIntermediate
    })

    return NextResponse.json({
      id: shortLink.id,
      path: shortLink.path,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${shortLink.path}`,
      originalUrl: shortLink.originalUrl,
      title: shortLink.title,
      views: shortLink.views,
      createdAt: shortLink.createdAt,
      hasPassword: !!shortLink.password,
      requireConfirm: shortLink.requireConfirm,
      enableIntermediate: shortLink.enableIntermediate
    })

  } catch (error) {
    console.error('创建短链失败:', error)
    await logError('创建短链失败', error, request)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 获取短链列表
export async function GET() {
  try {
    const links = await prisma.shortLink.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const formattedLinks = links.map(link => ({
      id: link.id,
      path: link.path,
      shortUrl: `${baseUrl}/${link.path}`,
      originalUrl: link.originalUrl,
      title: link.title,
      views: link.views,
      createdAt: link.createdAt,
      hasPassword: !!link.password,
      requireConfirm: link.requireConfirm,
      enableIntermediate: link.enableIntermediate
    }))

    return NextResponse.json(formattedLinks)
  } catch (error) {
    console.error('获取短链列表失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}