import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'
import readline from 'readline'

// 加载环境变量
config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

// 创建命令行交互接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 询问用户确认的函数
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim().toLowerCase())
    })
  })
}

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
  console.log('[启动] 开始数据库初始化检查...')
  
  // 检查现有数据
  const existingData = await checkExistingData()
  
  if (existingData.totalData > 0) {
    console.log('')
    console.log('⚠️  检测到数据库中已存在数据:')
    if (existingData.hasAdmins) console.log('   - 管理员账号')
    if (existingData.hasShortLinks) console.log('   - 短链接数据')
    if (existingData.hasSettings) console.log('   - 系统设置')
    console.log('')
    console.log('🔄 初始化选项:')
    console.log('   1. 全新安装 (清空所有数据并重新初始化)')
    console.log('   2. 升级模式 (仅更新缺失的设置，保留现有数据)')
    console.log('   3. 取消操作')
    console.log('')
    
    const choice = await askQuestion('请选择操作模式 (1/2/3): ')
    
    if (choice === '3' || choice === 'q' || choice === 'quit') {
      console.log('[取消] 操作已取消')
      rl.close()
      return
    } else if (choice === '1') {
      console.log('')
      console.log('⚠️  警告: 这将删除所有现有数据!')
      const confirm = await askQuestion('确认要继续吗？输入 "yes" 确认: ')
      
      if (confirm !== 'yes') {
        console.log('[取消] 操作已取消')
        rl.close()
        return
      }
      
      await fullReset()
    } else if (choice === '2') {
      await upgradeMode()
    } else {
      console.log('[错误] 无效选择，操作已取消')
      rl.close()
      return
    }
  } else {
    console.log('[检测] 数据库为空，执行全新初始化...')
    await fullReset()
  }
  
  rl.close()
}

// 全新安装模式 - 清空所有数据并重新初始化
async function fullReset() {
  console.log('[全新安装] 开始清空现有数据...')

  // 1. 清空所有现有数据
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

  await createDefaultSettings()
  
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

// 升级模式 - 仅更新缺失的设置，绝不覆盖现有管理员账号
async function upgradeMode() {
  console.log('[升级模式] 检查并更新系统设置...')
  
  // 检查是否有管理员账号
  const adminCount = await prisma.admin.count()
  if (adminCount === 0) {
    console.log('[创建] 数据库中没有管理员账号，创建默认管理员账号...')
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
    console.log('  ⚠️  请首次登录后立即修改密码')
  } else {
    console.log('  ✓ 检测到现有管理员账号，保持不变（不会覆盖或重置）')
    console.log('  ℹ️  如需重置管理员账号，请选择"全新安装"模式')
  }

  await createDefaultSettings()
  
  console.log('')
  console.log('✅ 升级完成！现有数据已保留，缺失的设置已补充')
}

// 创建默认系统设置
async function createDefaultSettings() {
  console.log('[设置] 创建/更新默认系统设置...')

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

  console.log('  ✓ 系统设置已更新')
}

main()
  .catch((e) => {
    console.error('[错误] 数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })