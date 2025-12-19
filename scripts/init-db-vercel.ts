import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

// 加载环境变量
config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

// 检查数据库是否已有数据
async function checkExistingData() {
  const [adminCount, shortLinkCount, settingCount] = await Promise.all([
    prisma.admin.count(),
    prisma.shortLink.count(),
    prisma.setting.count()
  ])
  
  return {
    hasAdmins: adminCount > 0,
    hasShortLinks: shortLinkCount > 0,
    hasSettings: settingCount > 0,
    totalData: adminCount + shortLinkCount + settingCount
  }
}

async function main() {
  console.log('[Vercel 部署] 开始数据库初始化...')
  
  // 检查现有数据
  const existingData = await checkExistingData()
  
  if (existingData.totalData > 0) {
    console.log('[检测] 发现现有数据，使用升级模式（保留所有数据）')
    if (existingData.hasAdmins) console.log('  - 管理员账号: 已存在')
    if (existingData.hasShortLinks) console.log('  - 短链接数据: 已存在')
    if (existingData.hasSettings) console.log('  - 系统设置: 已存在')
    
    await upgradeMode()
  } else {
    console.log('[检测] 数据库为空，执行全新初始化...')
    await fullInitialization()
  }
}

// 全新初始化模式 - 仅在数据库为空时使用
async function fullInitialization() {
  console.log('[全新初始化] 创建默认管理员账号...')
  
  const defaultPassword = 'Loooong123'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)
  
  await prisma.admin.create({
    data: {
      username: 'Loooong',
      password: hashedPassword,
      isDefault: true
    }
  })
  
  console.log('  ✓ 默认管理员账号已创建')
  console.log('  ✓ 用户名: Loooong')
  console.log('  ✓ 密码: Loooong123')
  
  await createDefaultSettings()
  
  console.log('')
  console.log('🔐 管理员登录信息:')
  console.log('   用户名: Loooong')
  console.log('   密码: Loooong123')
  console.log('   ⚠️  首次登录后请立即修改密码')
}

// 升级模式 - 保留所有现有数据，仅补充缺失设置
async function upgradeMode() {
  console.log('[升级模式] 检查并补充缺失的设置...')
  
  // 检查是否有管理员账号
  const adminCount = await prisma.admin.count()
  if (adminCount === 0) {
    console.log('[创建] 创建默认管理员账号...')
    const defaultPassword = 'Loooong123'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)
    
    await prisma.admin.create({
      data: {
        username: 'Loooong',
        password: hashedPassword,
        isDefault: true
      }
    })
    console.log('  ✓ 默认管理员账号已创建')
    console.log('  ✓ 用户名: Loooong')
    console.log('  ✓ 密码: Loooong123')
  } else {
    console.log('  ✓ 管理员账号已存在，跳过创建')
  }

  await createDefaultSettings()
  
  console.log('')
  console.log('✅ Vercel 部署完成！现有数据已保留，缺失的设置已补充')
}

// 创建默认系统设置
async function createDefaultSettings() {
  console.log('[设置] 检查并创建默认系统设置...')

  const settings = [
    { key: 'security_mode', value: 'blacklist', description: '安全模式' },
    { key: 'redirect_wait_time', value: '3', description: '重定向等待时间' },
    { key: 'captcha_enabled', value: 'false', description: '人机验证' },
    { key: 'preload_enabled', value: 'true', description: '预加载功能' },
    { key: 'auto_fill_password_enabled', value: 'true', description: '密码自动填充' }
  ]

  for (const setting of settings) {
    const existing = await prisma.setting.findUnique({
      where: { key: setting.key }
    })
    
    if (!existing) {
      await prisma.setting.create({
        data: {
          key: setting.key,
          value: setting.value
        }
      })
      console.log(`  ✓ 创建设置: ${setting.description} = ${setting.value}`)
    } else {
      console.log(`  - 跳过设置: ${setting.description} (已存在)`)
    }
  }
}

main()
  .catch((e) => {
    console.error('[错误] Vercel 数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })