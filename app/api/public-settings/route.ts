import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { translateForRequest } from '@/lib/translations'

// 获取公开的系统设置（不需要管理员权限）
export async function GET(request: NextRequest) {
  try {
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
    
    return NextResponse.json({
      waitTime: parseInt(waitTime?.value || '3'),
      captchaEnabled: captchaEnabled?.value === 'true',
      preloadEnabled: preloadEnabled?.value !== 'false', // 默认启用
      autoFillPasswordEnabled: autoFillPasswordEnabled?.value !== 'false', // 默认启用
    })
  } catch (error) {
    console.error('获取公开设置失败:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}