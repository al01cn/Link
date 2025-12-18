import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import path from 'path'

// 加载环境变量
config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function main() {
  console.log('[启动] 开始初始化数据库...')

  // 创建默认系统设置
  await prisma.setting.upsert({
    where: { key: 'security_mode' },
    update: {},
    create: {
      key: 'security_mode',
      value: 'blacklist'  // 默认使用黑名单模式
    }
  })

  await prisma.setting.upsert({
    where: { key: 'redirect_wait_time' },
    update: {},
    create: {
      key: 'redirect_wait_time',
      value: '3'
    }
  })

  // 创建人机验证设置
  await prisma.setting.upsert({
    where: { key: 'captcha_enabled' },
    update: {},
    create: {
      key: 'captcha_enabled',
      value: 'false'  // 默认关闭人机验证
    }
  })

  // 创建预加载设置
  await prisma.setting.upsert({
    where: { key: 'preload_enabled' },
    update: {},
    create: {
      key: 'preload_enabled',
      value: 'true'
    }
  })

  // 创建密码自动填充设置
  await prisma.setting.upsert({
    where: { key: 'auto_fill_password_enabled' },
    update: {},
    create: {
      key: 'auto_fill_password_enabled',
      value: 'true'  // 默认开启自动填充
    }
  })

  // 清理现有的域名规则（如果有的话）
  await prisma.domainRule.deleteMany({})
  
  console.log('[信息] 域名规则已清空，请在设置页面添加白名单域名')

  console.log('[完成] 数据库初始化完成！')
}

main()
  .catch((e) => {
    console.error('[错误] 数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })