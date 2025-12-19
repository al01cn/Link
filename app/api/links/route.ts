import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateShortPath, generateShortPathWithSettings, isValidUrl, fetchPageTitle, extractDomain, checkDomainAccessServer, getBaseUrl, generateShortUrl } from '@/lib/utils'
import { encryptPassword } from '@/lib/crypto'
import Logger from '@/lib/logger'
import { translateForRequest } from '@/lib/translations'
import { verifyAdminToken } from '@/lib/adminAuth'

// 创建短链
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminPayload = verifyAdminToken(request)
    if (!adminPayload) {
      return NextResponse.json({ error: translateForRequest(request, 'apiAdminRequired') }, { status: 401 })
    }

    const body = await request.json()
    const { 
      originalUrl, 
      title,
      description,
      customPath, 
      password, 
      expiresAt, 
      requireConfirm = false,
      enableIntermediate = true 
    } = body

    // 验证URL
    if (!isValidUrl(originalUrl)) {
      return NextResponse.json({ error: translateForRequest(request, 'invalidUrlFormat') }, { status: 400 })
    }

    // 验证自定义路径
    if (customPath) {
      if (!/^[a-zA-Z0-9_-]+$/.test(customPath)) {
        return NextResponse.json({ error: translateForRequest(request, 'pathOnlyLettersNumbers') }, { status: 400 })
      }
      if (customPath.length < 1) {
        return NextResponse.json({ error: translateForRequest(request, 'pathMinLength') }, { status: 400 })
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
          error: translateForRequest(request, 'apiDomainAccessForbidden')
        }, { status: 403 })
      }
    }

    // 检查是否已存在相同的原始URL（防止重复创建）
    const existingUrl = await prisma.shortLink.findFirst({
      where: { originalUrl }
    })
    
    if (existingUrl) {
      return NextResponse.json({ 
        error: translateForRequest(request, 'linkExists'),
        existingLink: {
          id: existingUrl.id,
          path: existingUrl.path,
          shortUrl: generateShortUrl(existingUrl.path, request)
        }
      }, { status: 409 })
    }

    // 生成或使用自定义路径
    let path = customPath || await generateShortPathWithSettings()
    
    // 检查路径是否已存在
    const existing = await prisma.shortLink.findUnique({
      where: { path }
    })
    
    if (existing) {
      if (customPath) {
        return NextResponse.json({ error: translateForRequest(request, 'linkExists') }, { status: 400 })
      }
      // 如果是随机生成的路径冲突，重新生成
      path = await generateShortPathWithSettings()
    }

    // 使用用户提供的标题，如果没有则尝试自动获取页面标题
    const finalTitle = title?.trim() || await fetchPageTitle(originalUrl)

    // 加密密码（如果有的话）
    const encryptedPassword = password ? encryptPassword(password) : null

    // 创建短链记录
    const shortLink = await prisma.shortLink.create({
      data: {
        path,
        originalUrl,
        title: finalTitle,
        description: description?.trim() || null,
        password: encryptedPassword,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        requireConfirm,
        enableIntermediate
      }
    })

    // 记录创建日志
    await Logger.logCreate(shortLink.path, originalUrl, Logger.extractRequestContext(request))

    return NextResponse.json({
      id: shortLink.id,
      path: shortLink.path,
      shortUrl: generateShortUrl(shortLink.path, request),
      originalUrl: shortLink.originalUrl,
      title: shortLink.title,
      description: shortLink.description,
      views: shortLink.views,
      createdAt: shortLink.createdAt,
      expiresAt: shortLink.expiresAt,
      hasPassword: !!shortLink.password,
      requireConfirm: shortLink.requireConfirm,
      enableIntermediate: shortLink.enableIntermediate
    })

  } catch (error) {
    console.error('创建短链失败:', error)
    await Logger.logError(error as Error, Logger.extractRequestContext(request))
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}

// 获取短链列表
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminPayload = verifyAdminToken(request)
    if (!adminPayload) {
      return NextResponse.json({ error: translateForRequest(request, 'apiAdminRequired') }, { status: 401 })
    }

    const links = await prisma.shortLink.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const formattedLinks = links.map(link => ({
      id: link.id,
      path: link.path,
      shortUrl: generateShortUrl(link.path, request),
      originalUrl: link.originalUrl,
      title: link.title,
      description: link.description,
      views: link.views,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      hasPassword: !!link.password,
      requireConfirm: link.requireConfirm,
      enableIntermediate: link.enableIntermediate
    }))

    return NextResponse.json(formattedLinks)
  } catch (error) {
    console.error('获取短链列表失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}