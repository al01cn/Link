/**
 * 日志系统迁移脚本
 * @description 将现有日志数据迁移到新的企业级日志表结构
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateLogs() {
  console.log('开始迁移日志系统...')
  
  try {
    // 1. 检查是否需要迁移 - 查找使用默认值的记录
    const existingLogs = await prisma.log.findMany({
      where: {
        OR: [
          { level: 'info', category: 'general', riskLevel: 'low' },
          { category: { equals: undefined } },
          { riskLevel: { equals: undefined } }
        ]
      },
      take: 1
    })

    // 2. 直接更新所有记录，确保它们有正确的字段值
    console.log('开始更新日志记录的企业级字段...')

    // 批量更新现有日志记录
    const batchSize = 1000
    let offset = 0
    let totalMigrated = 0

    while (true) {
      const logs = await prisma.log.findMany({
        take: batchSize,
        skip: offset,
        orderBy: { createdAt: 'asc' }
      })

      if (logs.length === 0) {
        break
      }

      // 批量更新日志记录
      for (const log of logs) {
        // 根据现有的 type 字段推断新字段的值
        let level = 'info'
        let category = 'general'
        let riskLevel = 'low'

        switch (log.type) {
          case 'error':
            level = 'error'
            category = 'system'
            riskLevel = 'medium'
            break
          case 'security':
            level = 'warn'
            category = 'security'
            riskLevel = 'high'
            break
          case 'admin':
            level = 'info'
            category = 'operation'
            riskLevel = 'medium'
            break
          case 'visit':
            level = 'info'
            category = 'access'
            riskLevel = 'low'
            break
          case 'create':
            level = 'info'
            category = 'operation'
            riskLevel = 'low'
            break
          case 'system':
            level = 'info'
            category = 'system'
            riskLevel = 'low'
            break
          default:
            level = 'info'
            category = 'general'
            riskLevel = 'low'
        }

        // 只更新需要更新的字段
        const updateData: any = {}
        if (log.level !== level) updateData.level = level
        if (log.category !== category) updateData.category = category
        if (log.riskLevel !== riskLevel) updateData.riskLevel = riskLevel

        if (Object.keys(updateData).length > 0) {
          await prisma.log.update({
            where: { id: log.id },
            data: updateData
          })
        }
      }

      totalMigrated += logs.length
      console.log(`已处理 ${totalMigrated} 条日志记录...`)
      offset += batchSize
    }

    console.log(`日志迁移完成！总共处理了 ${totalMigrated} 条记录`)

    // 3. 验证迁移结果
    const totalCount = await prisma.log.count()
    console.log(`验证：共有 ${totalCount} 条日志记录已成功处理`)

  } catch (error) {
    console.error('日志迁移失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 执行迁移
if (require.main === module) {
  migrateLogs()
    .then(() => {
      console.log('日志迁移脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('日志迁移脚本执行失败:', error)
      process.exit(1)
    })
}

export default migrateLogs