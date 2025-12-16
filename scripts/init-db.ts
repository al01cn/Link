import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import path from 'path'

// 加载环境变量
config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 开始初始化数据库...')

  // 创建默认系统设置
  await prisma.setting.upsert({
    where: { key: 'security_mode' },
    update: {},
    create: {
      key: 'security_mode',
      value: 'whitelist'  // 默认使用白名单模式
    }
  })

  await prisma.setting.upsert({
    where: { key: 'redirect_wait_time' },
    update: {},
    create: {
      key: 'redirect_wait_time',
      value: '5'
    }
  })

  // 清理现有的域名规则（如果有的话）
  await prisma.domainRule.deleteMany({})
  
  console.log('📋 域名规则已清空，请在设置页面添加白名单域名')

  console.log('✅ 数据库初始化完成！')
}

main()
  .catch((e) => {
    console.error('❌ 数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })