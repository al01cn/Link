import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { translateForRequest } from '@/lib/translations'
import { verifyAdminToken } from '@/lib/adminAuth'

// 获取系统设置
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminPayload = verifyAdminToken(request)
    if (!adminPayload) {
      return NextResponse.json({ error: translateForRequest(request, 'apiAdminRequired') }, { status: 401 })
    }

    // 获取安全模式设置
    const securityMode = await prisma.setting.findUnique({
      where: { key: 'security_mode' }
    })
    
    // 获取跳转等待时间设置
    const waitTime = await prisma.setting.findUnique({
      where: { key: 'redirect_wait_time' }
    })
    
    // 获取人机验证开关设置
    const captchaEnabled = await prisma.setting.findUnique({
      where: { key: 'captcha_enabled' }
    })
    
    // 获取预加载开关设置
    const preloadEnabled = await prisma.setting.findUnique({
      where: { key: 'preload_enabled' }
    })
    
    // 获取密码自动填充开关设置
    const autoFillPasswordEnabled = await prisma.setting.findUnique({
      where: { key: 'auto_fill_password_enabled' }
    })
    
    // 获取域名规则
    const domainRules = await prisma.domainRule.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      securityMode: securityMode?.value || 'blacklist',
      waitTime: parseInt(waitTime?.value || '3'),
      captchaEnabled: captchaEnabled?.value === 'true',
      preloadEnabled: preloadEnabled?.value !== 'false', // 默认启用
      autoFillPasswordEnabled: autoFillPasswordEnabled?.value !== 'false', // 默认启用
      domainRules
    })
  } catch (error) {
    console.error('获取设置失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}

// 更新系统设置
export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminPayload = verifyAdminToken(request)
    if (!adminPayload) {
      return NextResponse.json({ error: translateForRequest(request, 'apiAdminRequired') }, { status: 401 })
    }

    const body = await request.json()
    const { securityMode, waitTime, captchaEnabled, preloadEnabled, autoFillPasswordEnabled } = body
    
    // 更新安全模式
    if (securityMode) {
      await prisma.setting.upsert({
        where: { key: 'security_mode' },
        update: { value: securityMode },
        create: { key: 'security_mode', value: securityMode }
      })
    }
    
    // 更新跳转等待时间
    if (waitTime !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'redirect_wait_time' },
        update: { value: waitTime.toString() },
        create: { key: 'redirect_wait_time', value: waitTime.toString() }
      })
    }
    
    // 更新人机验证开关
    if (captchaEnabled !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'captcha_enabled' },
        update: { value: captchaEnabled.toString() },
        create: { key: 'captcha_enabled', value: captchaEnabled.toString() }
      })
    }
    
    // 更新预加载开关
    if (preloadEnabled !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'preload_enabled' },
        update: { value: preloadEnabled.toString() },
        create: { key: 'preload_enabled', value: preloadEnabled.toString() }
      })
    }
    
    // 更新密码自动填充开关
    if (autoFillPasswordEnabled !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'auto_fill_password_enabled' },
        update: { value: autoFillPasswordEnabled.toString() },
        create: { key: 'auto_fill_password_enabled', value: autoFillPasswordEnabled.toString() }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新设置失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}