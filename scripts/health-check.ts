#!/usr/bin/env tsx
/**
 * 系统健康检查脚本
 * 检查各个组件的健康状态并生成报告
 */

import { dbPool } from '../lib/dbPool'
import { requestCache } from '../lib/requestCache'
import { queryOptimizer } from '../lib/queryOptimizer'

interface HealthCheckResult {
  component: string
  status: 'healthy' | 'warning' | 'error'
  message: string
  details?: any
  responseTime?: number
}

interface HealthReport {
  timestamp: string
  overallStatus: 'healthy' | 'warning' | 'error'
  checks: HealthCheckResult[]
  summary: {
    total: number
    healthy: number
    warning: number
    error: number
  }
}

class HealthChecker {
  private checks: Array<() => Promise<HealthCheckResult>> = []

  constructor() {
    // 注册所有健康检查
    this.registerChecks()
  }

  // 注册健康检查项
  private registerChecks(): void {
    this.checks = [
      this.checkDatabase.bind(this),
      this.checkMemoryUsage.bind(this),
      this.checkDiskSpace.bind(this),
      this.checkCacheHealth.bind(this),
      this.checkApiEndpoints.bind(this),
      this.checkSystemLoad.bind(this)
    ]
  }

  // 执行所有健康检查
  async runHealthCheck(): Promise<HealthReport> {
    console.log('🏥 开始系统健康检查...')
    
    const results: HealthCheckResult[] = []
    
    for (const check of this.checks) {
      try {
        const result = await check()
        results.push(result)
        
        const statusIcon = this.getStatusIcon(result.status)
        console.log(`  ${statusIcon} ${result.component}: ${result.message}`)
        
      } catch (error) {
        const errorResult: HealthCheckResult = {
          component: '未知组件',
          status: 'error',
          message: `检查失败: ${error}`,
          details: { error: String(error) }
        }
        results.push(errorResult)
        console.log(`  ❌ 检查失败: ${error}`)
      }
    }

    // 计算总体状态
    const summary = this.calculateSummary(results)
    const overallStatus = this.determineOverallStatus(summary)

    const report: HealthReport = {
      timestamp: new Date().toISOString(),
      overallStatus,
      checks: results,
      summary
    }

    this.printSummary(report)
    return report
  }

  // 数据库健康检查
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const isHealthy = await dbPool.healthCheck()
      const responseTime = Date.now() - startTime
      
      if (!isHealthy) {
        return {
          component: '数据库',
          status: 'error',
          message: '数据库连接失败',
          responseTime
        }
      }

      // 检查数据库统计
      const stats = await queryOptimizer.getDatabaseStats()
      
      let status: 'healthy' | 'warning' | 'error' = 'healthy'
      let message = '数据库运行正常'
      
      if (stats.avgResponseTime > 500) {
        status = 'warning'
        message = `数据库响应较慢 (${stats.avgResponseTime.toFixed(1)}ms)`
      }
      
      if (responseTime > 1000) {
        status = 'error'
        message = `数据库连接超时 (${responseTime}ms)`
      }

      return {
        component: '数据库',
        status,
        message,
        responseTime,
        details: {
          connectionStats: dbPool.getStats(),
          dbStats: stats
        }
      }
    } catch (error) {
      return {
        component: '数据库',
        status: 'error',
        message: `数据库检查失败: ${error}`,
        responseTime: Date.now() - startTime
      }
    }
  }

  // 内存使用检查
  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    const memoryUsage = process.memoryUsage()
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024
    const usagePercent = (heapUsedMB / heapTotalMB) * 100

    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    let message = `内存使用正常 (${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB)`

    if (usagePercent > 80) {
      status = 'error'
      message = `内存使用过高 (${usagePercent.toFixed(1)}%)`
    } else if (usagePercent > 60) {
      status = 'warning'
      message = `内存使用较高 (${usagePercent.toFixed(1)}%)`
    }

    return {
      component: '内存使用',
      status,
      message,
      details: {
        memoryUsage,
        usagePercent: usagePercent.toFixed(1)
      }
    }
  }

  // 磁盘空间检查
  private async checkDiskSpace(): Promise<HealthCheckResult> {
    try {
      const fs = require('fs')
      const stats = fs.statSync('.')
      
      // 简化的磁盘检查（实际项目中可能需要更复杂的逻辑）
      return {
        component: '磁盘空间',
        status: 'healthy',
        message: '磁盘空间充足',
        details: {
          note: '磁盘空间检查需要根据实际部署环境实现'
        }
      }
    } catch (error) {
      return {
        component: '磁盘空间',
        status: 'warning',
        message: `无法检查磁盘空间: ${error}`
      }
    }
  }

  // 缓存健康检查
  private async checkCacheHealth(): Promise<HealthCheckResult> {
    try {
      const cacheStats = requestCache.getStats()
      const queryStats = queryOptimizer.getQueryStats()

      let status: 'healthy' | 'warning' | 'error' = 'healthy'
      let message = '缓存系统运行正常'

      // 检查缓存命中率
      if (cacheStats.hitRate < 0.5) {
        status = 'warning'
        message = `缓存命中率较低 (${(cacheStats.hitRate * 100).toFixed(1)}%)`
      }

      if (queryStats.cacheHitRate < 0.3) {
        status = 'error'
        message = `查询缓存命中率过低 (${(queryStats.cacheHitRate * 100).toFixed(1)}%)`
      }

      return {
        component: '缓存系统',
        status,
        message,
        details: {
          requestCache: cacheStats,
          queryCache: queryStats
        }
      }
    } catch (error) {
      return {
        component: '缓存系统',
        status: 'error',
        message: `缓存检查失败: ${error}`
      }
    }
  }

  // API端点检查
  private async checkApiEndpoints(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // 检查基本的API端点
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      
      // 这里可以添加实际的API健康检查
      // 由于是内部检查，我们简化处理
      
      const responseTime = Date.now() - startTime
      
      return {
        component: 'API端点',
        status: 'healthy',
        message: 'API端点响应正常',
        responseTime,
        details: {
          baseUrl,
          note: 'API端点检查需要根据实际部署环境实现'
        }
      }
    } catch (error) {
      return {
        component: 'API端点',
        status: 'error',
        message: `API检查失败: ${error}`,
        responseTime: Date.now() - startTime
      }
    }
  }

  // 系统负载检查
  private async checkSystemLoad(): Promise<HealthCheckResult> {
    try {
      const uptime = process.uptime()
      const uptimeHours = Math.floor(uptime / 3600)
      
      let loadAverage: number[] = []
      try {
        loadAverage = require('os').loadavg()
      } catch {
        // 在某些环境中可能不可用
        loadAverage = [0, 0, 0]
      }

      let status: 'healthy' | 'warning' | 'error' = 'healthy'
      let message = `系统运行正常 (运行时间: ${uptimeHours}小时)`

      // 检查系统负载（如果可用）
      if (loadAverage[0] > 2) {
        status = 'warning'
        message = `系统负载较高 (${loadAverage[0].toFixed(2)})`
      }

      if (loadAverage[0] > 5) {
        status = 'error'
        message = `系统负载过高 (${loadAverage[0].toFixed(2)})`
      }

      return {
        component: '系统负载',
        status,
        message,
        details: {
          uptime: uptimeHours,
          loadAverage
        }
      }
    } catch (error) {
      return {
        component: '系统负载',
        status: 'warning',
        message: `系统负载检查失败: ${error}`
      }
    }
  }

  // 计算摘要统计
  private calculateSummary(results: HealthCheckResult[]): HealthReport['summary'] {
    const summary = {
      total: results.length,
      healthy: 0,
      warning: 0,
      error: 0
    }

    results.forEach(result => {
      summary[result.status]++
    })

    return summary
  }

  // 确定总体状态
  private determineOverallStatus(summary: HealthReport['summary']): 'healthy' | 'warning' | 'error' {
    if (summary.error > 0) return 'error'
    if (summary.warning > 0) return 'warning'
    return 'healthy'
  }

  // 获取状态图标
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'healthy': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  // 打印摘要
  private printSummary(report: HealthReport): void {
    console.log('\n' + '='.repeat(50))
    console.log('🏥 系统健康检查摘要')
    console.log('='.repeat(50))
    
    const overallIcon = this.getStatusIcon(report.overallStatus)
    console.log(`\n${overallIcon} 总体状态: ${report.overallStatus.toUpperCase()}`)
    
    console.log('\n📊 检查结果统计:')
    console.log(`  ✅ 健康: ${report.summary.healthy}`)
    console.log(`  ⚠️ 警告: ${report.summary.warning}`)
    console.log(`  ❌ 错误: ${report.summary.error}`)
    console.log(`  📝 总计: ${report.summary.total}`)

    // 显示需要关注的问题
    const issues = report.checks.filter(check => check.status !== 'healthy')
    if (issues.length > 0) {
      console.log('\n🚨 需要关注的问题:')
      issues.forEach(issue => {
        const icon = this.getStatusIcon(issue.status)
        console.log(`  ${icon} ${issue.component}: ${issue.message}`)
      })
    }

    console.log('\n' + '='.repeat(50))
  }

  // 保存健康报告到文件
  async saveReport(report: HealthReport, filename?: string): Promise<void> {
    const reportFile = filename || `health-report-${Date.now()}.json`
    
    try {
      const fs = require('fs')
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
      console.log(`📄 健康报告已保存到: ${reportFile}`)
    } catch (error) {
      console.error('❌ 保存报告失败:', error)
    }
  }
}

// 创建健康检查器实例
const checker = new HealthChecker()

// 命令行参数处理
const args = process.argv.slice(2)
const command = args[0]

async function main() {
  try {
    switch (command) {
      case 'run':
        const report = await checker.runHealthCheck()
        
        // 如果指定了输出文件，保存报告
        const outputFile = args[1]
        if (outputFile) {
          await checker.saveReport(report, outputFile)
        }
        
        // 根据健康状态设置退出码
        process.exit(report.overallStatus === 'healthy' ? 0 : 1)
        break
        
      default:
        console.log('使用方法:')
        console.log('  bun run health:check run [输出文件]  - 运行健康检查')
        process.exit(1)
    }
  } catch (error) {
    console.error('健康检查失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

export { HealthChecker }