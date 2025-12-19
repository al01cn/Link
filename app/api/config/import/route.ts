import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAdminToken } from '@/lib/adminAuth'
import { isValidUUID } from '@/lib/utils'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminPayload = verifyAdminToken(request)
    if (!adminPayload) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { data, type = 'all' } = body

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: '无效的导入数据' }, { status: 400 })
    }

    // 验证数据格式
    if (!data.version || !data.exportTime) {
      return NextResponse.json({ error: '无效的配置文件格式' }, { status: 400 })
    }

    let importedCount = 0

    // 导入系统设置
    if ((type === 'all' || type === 'settings') && data.settings) {
      const settings = data.settings
      
      // 更新或创建系统设置
      const settingsToUpdate = [
        { key: 'security_mode', value: settings.securityMode || 'blacklist' },
        { key: 'redirect_wait_time', value: String(settings.waitTime || 3) },
        { key: 'captcha_enabled', value: String(settings.captchaEnabled || false) },
        { key: 'preload_enabled', value: String(settings.preloadEnabled !== false) },
        { key: 'auto_fill_password_enabled', value: String(settings.autoFillPasswordEnabled !== false) }
      ]

      // 逐个更新设置项
      for (const setting of settingsToUpdate) {
        await prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value }
        })
      }

      // 导入域名规则
      if (data.domainRules && Array.isArray(data.domainRules)) {
        // 清除现有域名规则
        await prisma.domainRule.deleteMany()
        
        // 导入新的域名规则
        for (const rule of data.domainRules) {
          if (rule.domain && rule.type) {
            await prisma.domainRule.create({
              data: {
                domain: rule.domain,
                type: rule.type,
                active: rule.active !== false
              }
            })
            importedCount++
          }
        }
      }
    }

    // 导入短链数据
    if ((type === 'all' || type === 'links') && data.links && Array.isArray(data.links)) {
      for (const link of data.links) {
        if (link.path && link.originalUrl) {
          try {
            // 检查路径是否已存在
            const existing = await prisma.shortLink.findUnique({
              where: { path: link.path }
            })

            if (!existing) {
              // 准备创建数据
              const createData: any = {
                path: link.path,
                originalUrl: link.originalUrl,
                title: link.title || null,
                description: link.description || null,
                password: link.password || null, // 导入加密后的密码
                expiresAt: link.expiresAt ? new Date(link.expiresAt) : null,
                requireConfirm: link.requireConfirm || false,
                enableIntermediate: link.enableIntermediate !== false,
                views: link.views || 0
              }

              // 如果导入数据包含有效的UUID，则使用它
              if (link.id && isValidUUID(link.id)) {
                // 检查ID是否已存在
                const existingById = await prisma.shortLink.findUnique({
                  where: { id: link.id }
                })
                if (!existingById) {
                  createData.id = link.id
                }
              }

              await prisma.shortLink.create({
                data: createData
              })
              importedCount++
            }
          } catch (error) {
            console.error(`导入短链失败 ${link.path}:`, error)
            // 继续处理其他链接
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '导入成功',
      importedCount
    })

  } catch (error) {
    console.error('导入配置失败:', error)
    return NextResponse.json({ error: '导入失败' }, { status: 500 })
  }
}