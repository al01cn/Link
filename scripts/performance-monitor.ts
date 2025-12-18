#!/usr/bin/env tsx
/**
 * 性能监控脚本
 * 实时监控系统性能指标并生成报告
 */

import { performanceMonitor } from '../lib/performance'
import { requestCache } from '../lib/requestCache'
import { queryOptimizer } from '../lib/queryOptimizer'
import { dbPool } from '../lib/dbPool'

interface PerformanceReport {
  timestamp: string
  system: {
    memory: NodeJS.MemoryUsage
    uptime: number
    loadAverage: number[]
  }
  database: {
    connectionStats: any
    queryStats: any
    dbStats: any
  }
  cache: {
    requestCacheStats: any
    queryCacheStats: any
  }
  api: {
    performanceStats: any
    realTimeMetrics: any
  }
  recommendations: string[]
}

class PerformanceReporter {
  private reportInterval: NodeJS.Timeout | null = null
  private isMonitoring = false

  // 开始监控
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.log('⚠️ 性能监控已在运行中')
      return
    }

    console.log('🚀 开始性能监控...')
    this.isMonitoring = true

    // 立即生成一次报告
    this.generateReport()

    // 定期生成报告
    this.reportInterval = setInterval(() => {
      this.generateReport()
    }, intervalMs)
  }

  // 停止监控
  stopMonitoring(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval)
      this.reportInterval = null
    }
    this.isMonitoring = false
    console.log('⏹️ 性能监控已停止')
  }

  // 生成性能报告
  async generateReport(): Promise<PerformanceReport> {
    try {
      const report: PerformanceReport = {
        timestamp: new Date().toISOString(),
        system: await this.getSystemMetrics(),
        database: await this.getDatabaseMetrics(),
        cache: await this.getCacheMetrics(),
        api: await this.getApiMetrics(),
        recommendations: []
      }

      // 生成优化建议
      report.recommendations = this.generateRecommendations(report)

      // 输出报告
      this.printReport(report)

      return report
    } catch (error) {
      console.error('❌ 生成性能报告失败:', error)
      throw error
    }
  }

  // 获取系统指标
  private async getSystemMetrics(): Promise<PerformanceReport['system']> {
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()
    
    // 在 Node.js 环境中，loadavg 可能不可用
    let loadAverage: number[] = []
    try {
      loadAverage = require('os').loadavg()
    } catch {
      loadAverage = [0, 0, 0] // 默认值
    }

    return {
      memory: memoryUsage,
      uptime,
      loadAverage
    }
  }

  // 获取数据库指标
  private async getDatabaseMetrics(): Promise<PerformanceReport['database']> {
    try {
      const [connectionStats, queryStats, dbStats] = await Promise.all([
        dbPool.getStats(),
        queryOptimizer.getQueryStats(),
        queryOptimizer.getDatabaseStats()
      ])

      return {
        connectionStats,
        queryStats,
        dbStats
      }
    } catch (error) {
      console.warn('⚠️ 获取数据库指标失败:', error)
      return {
        connectionStats: null,
        queryStats: null,
        dbStats: null
      }
    }
  }

  // 获取缓存指标
  private async getCacheMetrics(): Promise<PerformanceReport['cache']> {
    try {
      const requestCacheStats = requestCache.getStats()
      const queryCacheStats = queryOptimizer.getQueryStats()

      return {
        requestCacheStats,
        queryCacheStats
      }
    } catch (error) {
      console.warn('⚠️ 获取缓存指标失败:', error)
      return {
        requestCacheStats: null,
        queryCacheStats: null
      }
    }
  }

  // 获取API指标
  private async getApiMetrics(): Promise<PerformanceReport['api']> {
    try {
      const performanceStats = performanceMonitor.getStats()
      const realTimeMetrics = performanceMonitor.getRealTimeMetrics()

      return {
        performanceStats,
        realTimeMetrics
      }
    } catch (error) {
      console.warn('⚠️ 获取API指标失败:', error)
      return {
        performanceStats: null,
        realTimeMetrics: null
      }
    }
  }

  // 生成优化建议
  private generateRecommendations(report: PerformanceReport): string[] {
    const recommendations: string[] = []

    // 内存使用建议
    const memoryUsageMB = report.system.memory.heapUsed / 1024 / 1024
    if (memoryUsageMB > 500) {
      recommendations.push(`内存使用过高 (${memoryUsageMB.toFixed(1)}MB)，建议检查内存泄漏`)
    }

    // 数据库性能建议
    if (report.database.queryStats?.avgExecutionTime > 100) {
      recommendations.push(`数据库查询平均响应时间过长 (${report.database.queryStats.avgExecutionTime.toFixed(1)}ms)`)
    }

    if (report.database.queryStats?.cacheHitRate < 0.8) {
      recommendations.push(`数据库缓存命中率较低 (${(report.database.queryStats.cacheHitRate * 100).toFixed(1)}%)，建议优化缓存策略`)
    }

    // API性能建议
    if (report.api.performanceStats?.averageResponseTime > 500) {
      recommendations.push(`API平均响应时间过长 (${report.api.performanceStats.averageResponseTime.toFixed(1)}ms)`)
    }

    if (report.api.performanceStats?.errorRate > 0.05) {
      recommendations.push(`API错误率较高 (${(report.api.performanceStats.errorRate * 100).toFixed(1)}%)`)
    }

    // 缓存建议
    if (report.cache.requestCacheStats?.hitRate < 0.7) {
      recommendations.push(`请求缓存命中率较低 (${(report.cache.requestCacheStats.hitRate * 100).toFixed(1)}%)`)
    }

    return recommendations
  }

  // 打印报告
  private printReport(report: PerformanceReport): void {
    console.log('\n' + '='.repeat(60))
    console.log(`📊 性能监控报告 - ${new Date(report.timestamp).toLocaleString('zh-CN')}`)
    console.log('='.repeat(60))

    // 系统指标
    console.log('\n🖥️ 系统指标:')
    console.log(`  内存使用: ${(report.system.memory.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(report.system.memory.heapTotal / 1024 / 1024).toFixed(1)}MB`)
    console.log(`  运行时间: ${Math.floor(report.system.uptime / 3600)}小时 ${Math.floor((report.system.uptime % 3600) / 60)}分钟`)
    console.log(`  系统负载: ${report.system.loadAverage.map(load => load.toFixed(2)).join(', ')}`)

    // 数据库指标
    if (report.database.dbStats) {
      console.log('\n🗄️ 数据库指标:')
      console.log(`  总短链数: ${report.database.dbStats.totalLinks}`)
      console.log(`  活跃短链: ${report.database.dbStats.activeLinks}`)
      console.log(`  总访问数: ${report.database.dbStats.totalVisits}`)
      console.log(`  平均查询时间: ${report.database.dbStats.avgResponseTime.toFixed(2)}ms`)
    }

    if (report.database.queryStats) {
      console.log(`  查询缓存命中率: ${(report.database.queryStats.cacheHitRate * 100).toFixed(1)}%`)
      console.log(`  慢查询数量: ${report.database.queryStats.slowQueries.length}`)
    }

    // API指标
    if (report.api.performanceStats) {
      console.log('\n🌐 API指标:')
      console.log(`  总请求数: ${report.api.performanceStats.totalRequests}`)
      console.log(`  平均响应时间: ${report.api.performanceStats.averageResponseTime.toFixed(1)}ms`)
      console.log(`  慢请求数: ${report.api.performanceStats.slowRequests}`)
      console.log(`  错误率: ${(report.api.performanceStats.errorRate * 100).toFixed(2)}%`)
    }

    if (report.api.realTimeMetrics) {
      console.log(`  当前活跃请求: ${report.api.realTimeMetrics.activeRequests}`)
    }

    // 缓存指标
    if (report.cache.requestCacheStats) {
      console.log('\n💾 缓存指标:')
      console.log(`  请求缓存大小: ${report.cache.requestCacheStats.size}`)
      console.log(`  请求缓存命中率: ${(report.cache.requestCacheStats.hitRate * 100).toFixed(1)}%`)
    }

    // 优化建议
    if (report.recommendations.length > 0) {
      console.log('\n💡 优化建议:')
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`)
      })
    } else {
      console.log('\n✅ 系统性能良好，暂无优化建议')
    }

    console.log('\n' + '='.repeat(60) + '\n')
  }

  // 生成详细的性能报告文件
  async generateDetailedReport(outputPath?: string): Promise<void> {
    const report = await this.generateReport()
    const reportContent = JSON.stringify(report, null, 2)
    
    const filename = outputPath || `performance-report-${Date.now()}.json`
    
    try {
      const fs = require('fs')
      fs.writeFileSync(filename, reportContent)
      console.log(`📄 详细报告已保存到: ${filename}`)
    } catch (error) {
      console.error('❌ 保存报告失败:', error)
    }
  }
}

// 创建性能报告器实例
const reporter = new PerformanceReporter()

// 命令行参数处理
const args = process.argv.slice(2)
const command = args[0]

switch (command) {
  case 'start':
    const interval = parseInt(args[1]) || 60000
    reporter.startMonitoring(interval)
    
    // 监听退出信号
    process.on('SIGINT', () => {
      console.log('\n收到退出信号，正在停止监控...')
      reporter.stopMonitoring()
      process.exit(0)
    })
    break
    
  case 'report':
    reporter.generateReport().then(() => {
      process.exit(0)
    }).catch((error) => {
      console.error('生成报告失败:', error)
      process.exit(1)
    })
    break
    
  case 'detailed':
    const outputPath = args[1]
    reporter.generateDetailedReport(outputPath).then(() => {
      process.exit(0)
    }).catch((error) => {
      console.error('生成详细报告失败:', error)
      process.exit(1)
    })
    break
    
  default:
    console.log('使用方法:')
    console.log('  bun run perf:monitor start [间隔毫秒]  - 开始监控')
    console.log('  bun run perf:monitor report           - 生成单次报告')
    console.log('  bun run perf:monitor detailed [文件]  - 生成详细报告文件')
    process.exit(1)
}

export { PerformanceReporter }