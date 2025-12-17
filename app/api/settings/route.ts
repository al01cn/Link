import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 获取系统设置
export async function GET() {
  try {
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
    
    // 获取域名规则
    const domainRules = await prisma.domainRule.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      securityMode: securityMode?.value || 'whitelist',
      waitTime: parseInt(waitTime?.value || '5'),
      captchaEnabled: captchaEnabled?.value === 'true',
      domainRules
    })
  } catch (error) {
    console.error('获取设置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 更新系统设置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { securityMode, waitTime, captchaEnabled } = body
    
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
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新设置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}