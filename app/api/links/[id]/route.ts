import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { decryptPassword, encryptPassword } from '@/lib/crypto'
import { verifyAdminToken } from '@/lib/adminAuth'
import { isValidUUID, isValidUrl, fetchPageTitle, extractDomain, checkDomainAccessServer, getBaseUrl, generateShortUrl } from '@/lib/utils'
import { translateForRequest } from '@/lib/translations'

// 获取单个短链信息（包括密码）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 验证UUID格式
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: translateForRequest(request, 'apiInvalidId') }, { status: 400 })
    }

    // 检查管理员权限
    const adminPayload = verifyAdminToken(request)
    if (!adminPayload) {
      return NextResponse.json({ error: translateForRequest(request, 'apiAdminRequired') }, { status: 401 })
    }

    const link = await prisma.shortLink.findUnique({
      where: { id }
    })

    if (!link) {
      return NextResponse.json({ error: translateForRequest(request, 'apiLinkNotFound') }, { status: 404 })
    }

    // 解密密码（如果有的话）
    const decryptedPassword = link.password ? decryptPassword(link.password) : null

    return NextResponse.json({
      id: link.id,
      password: decryptedPassword,
      hasPassword: !!link.password
    })
  } catch (error) {
    console.error('获取短链信息失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}

// 更新短链
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const adminPayload = verifyAdminToken(request)
    if (!adminPayload) {
      return NextResponse.json({ error: translateForRequest(request, 'apiAdminRequired') }, { status: 401 })
    }

    const { id } = await params
    
    // 验证UUID格式
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: translateForRequest(request, 'apiInvalidId') }, { status: 400 })
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

    // 检查短链是否存在
    const existingLink = await prisma.shortLink.findUnique({
      where: { id }
    })

    if (!existingLink) {
      return NextResponse.json({ error: translateForRequest(request, 'apiLinkNotFound') }, { status: 404 })
    }

    // 如果提供了自定义路径，检查是否与其他短链冲突
    if (customPath && customPath !== existingLink.path) {
      const pathExists = await prisma.shortLink.findUnique({
        where: { path: customPath }
      })
      
      if (pathExists) {
        return NextResponse.json({ error: translateForRequest(request, 'linkExists') }, { status: 400 })
      }
    }

    // 处理标题：优先使用用户提供的标题，如果没有且URL变化了则自动获取
    let finalTitle = existingLink.title
    if (title !== undefined) {
      // 用户明确提供了标题（可能为空字符串）
      finalTitle = title.trim() || null
    } else if (originalUrl !== existingLink.originalUrl) {
      // URL变化了但用户没有提供标题，自动获取
      finalTitle = await fetchPageTitle(originalUrl)
    }

    // 处理密码
    let encryptedPassword = existingLink.password
    if (password !== undefined) {
      encryptedPassword = password ? encryptPassword(password) : null
    }

    // 更新短链记录
    const updatedLink = await prisma.shortLink.update({
      where: { id },
      data: {
        ...(customPath && customPath !== existingLink.path && { path: customPath }),
        originalUrl,
        title: finalTitle,
        description: description !== undefined ? (description.trim() || null) : existingLink.description,
        password: encryptedPassword,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        requireConfirm,
        enableIntermediate
      }
    })

    return NextResponse.json({
      id: updatedLink.id,
      path: updatedLink.path,
      shortUrl: generateShortUrl(updatedLink.path, request),
      originalUrl: updatedLink.originalUrl,
      title: updatedLink.title,
      description: updatedLink.description,
      views: updatedLink.views,
      createdAt: updatedLink.createdAt,
      expiresAt: updatedLink.expiresAt,
      hasPassword: !!updatedLink.password,
      requireConfirm: updatedLink.requireConfirm,
      enableIntermediate: updatedLink.enableIntermediate
    })

  } catch (error) {
    console.error('更新短链失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}

// 删除短链
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const adminPayload = verifyAdminToken(request)
    if (!adminPayload) {
      return NextResponse.json({ error: translateForRequest(request, 'apiAdminRequired') }, { status: 401 })
    }

    const { id } = await params
    
    // 验证UUID格式
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: translateForRequest(request, 'apiInvalidId') }, { status: 400 })
    }

    await prisma.shortLink.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除短链失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}