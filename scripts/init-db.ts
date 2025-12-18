import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

// 加载环境变量
config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function main() {
  console.log('[启动] 开始初始化数据库...')

  // 1. 清空所有现有数据
  console.log('[清理] 清空现有数据...')
  await prisma.visitLog.deleteMany({})
  console.log('  ✓ 访问日志已清空')
  
  await prisma.shortLink.deleteMany({})
  console.log('  ✓ 短链接数据已清空')
  
  await prisma.log.deleteMany({})
  console.log('  ✓ 系统日志已清空')
  
  await prisma.domainRule.deleteMany({})
  console.log('  ✓ 域名规则已清空')
  
  await prisma.setting.deleteMany({})
  console.log('  ✓ 系统设置已清空')

  // 2. 重置管理员账号
  console.log('[重置] 重置管理员账号...')
  const defaultPassword = 'Loooong123'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)
  
  await prisma.admin.deleteMany({}) // 清空现有管理员
  await prisma.admin.create({
    data: {
      username: 'Loooong',
      password: hashedPassword,
      isDefault: true // 标记为默认账户
    }
  })
  console.log('  ✓ 管理员账号已重置')
  console.log('  ✓ 默认用户名: Loooong')
  console.log('  ✓ 默认密码: Loooong123')
  console.log('  ✓ 请首次登录后立即修改密码')

  // 3. 创建默认系统设置
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

  console.log('[完成] 数据库初始化完成！')
  console.log('')
  console.log('🔐 管理员登录信息:')
  console.log('   用户名: Loooong')
  console.log('   密码: Loooong123')
  console.log('   ⚠️  首次登录后请立即修改密码')
  console.log('')
  console.log('⚙️  下一步操作:')
  console.log('   1. 在设置页面配置域名白名单')
  console.log('   2. 根据需要调整安全设置')
  console.log('   3. 配置人机验证（可选）')
}

main()
  .catch((e) => {
    console.error('[错误] 数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })