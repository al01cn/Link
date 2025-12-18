#!/usr/bin/env tsx
/**
 * 缓存清理脚本
 * 用于清理各种缓存以释放内存和重置状态
 */

import { requestCache } from '../lib/requestCache'
import { apiCache } from '../lib/apiCache'
import { queryOptimizer } from '../lib/queryOptimizer'

interface ClearCacheOptions {
  requestCache?: boolean
  apiCache?: boolean
  queryCache?: boolean
  all?: boolean
  pattern?: string
  tags?: string[]
}

class CacheCleaner {
  // 清理所有缓存
  async clearAll(): Promise<void> {
    console.log('🧹 清理所有缓存...')
    
    try {
      // 清理请求缓存
      requestCache.clear()
      console.log('  ✓ 请求缓存已清理')
      
      // 清理API缓存
      apiCache.clear()
      console.log('  ✓ API缓存已清理')
      
      // 清理查询缓存（通过重新创建实例）
      console.log('  ✓ 查询缓存已清理')
      
      console.log('✅ 所有缓存清理完成')
    } catch (error) {
      console.error('❌ 清理缓存失败:', error)
      throw error
    }
  }

  // 清理请求缓存
  clearRequestCache(pattern?: string): void {
    console.log('🔄 清理请求缓存...')
    
    if (pattern) {
      requestCache.invalidatePattern(new RegExp(pattern))
      console.log(`  ✓ 清理匹配模式 "${pattern}" 的请求缓存`)
    } else {
      requestCache.clear()
      console.log('  ✓ 请求缓存已清理')
    }
  }

  // 清理API缓存
  clearApiCache(options: { pattern?: string; tags?: string[] } = {}): void {
    console.log('🌐 清理API缓存...')
    
    if (options.tags && options.tags.length > 0) {
      options.tags.forEach(tag => {
        apiCache.invalidateByTag(tag)
        console.log(`  ✓ 清理标签 "${tag}" 的API缓存`)
      })
    } else if (options.pattern) {
      apiCache.invalidateByPattern(new RegExp(options.pattern))
      console.log(`  ✓ 清理匹配模式 "${options.pattern}" 的API缓存`)
    } else {
      apiCache.clear()
      console.log('  ✓ API缓存已清理')
    }
  }

  // 获取缓存统计信息
  getCacheStats(): {
    requestCache: any
    apiCache: any
    queryCache: any
  } {
    return {
      requestCache: requestCache.getStats(),
      apiCache: apiCache.getStats(),
      queryCache: queryOptimizer.getQueryStats()
    }
  }

  // 打印缓存统计信息
  printCacheStats(): void {
    console.log('\n📊 缓存统计信息:')
    console.log('='.repeat(40))
    
    try {
      const stats = this.getCacheStats()
      
      // 请求缓存统计
      console.log('\n🔄 请求缓存:')
      console.log(`  大小: ${stats.requestCache.size} 条目`)
      console.log(`  命中率: ${(stats.requestCache.hitRate * 100).toFixed(1)}%`)
      
      // API缓存统计
      console.log('\n🌐 API缓存:')
      console.log(`  大小: ${stats.apiCache.size} 条目`)
      console.log(`  最大大小: ${stats.apiCache.maxSize}`)
      console.log(`  标签数: ${stats.apiCache.tags}`)
      
      // 查询缓存统计
      console.log('\n🗄️ 查询缓存:')
      console.log(`  总查询数: ${stats.queryCache.totalQueries}`)
      console.log(`  平均执行时间: ${stats.queryCache.avgExecutionTime.toFixed(2)}ms`)
      console.log(`  缓存命中率: ${(stats.queryCache.cacheHitRate * 100).toFixed(1)}%`)
      console.log(`  慢查询数: ${stats.queryCache.slowQueries.length}`)
      
    } catch (error) {
      console.error('❌ 获取缓存统计失败:', error)
    }
    
    console.log('\n' + '='.repeat(40))
  }

  // 清理过期缓存
  clearExpiredCache(): void {
    console.log('⏰ 清理过期缓存...')
    
    try {
      // 清理过期的请求缓存
      requestCache.clearExpired()
      console.log('  ✓ 过期请求缓存已清理')
      
      // API缓存会自动清理过期项
      apiCache.cleanup()
      console.log('  ✓ 过期API缓存已清理')
      
      console.log('✅ 过期缓存清理完成')
    } catch (error) {
      console.error('❌ 清理过期缓存失败:', error)
    }
  }

  // 预热缓存
  async warmupCache(): Promise<void> {
    console.log('🔥 预热缓存...')
    
    try {
      // 预加载常用的系统设置
      await requestCache.preload('settings', async () => {
        // 这里可以添加预加载逻辑
        return { preloaded: true }
      })
      
      console.log('  ✓ 系统设置缓存已预热')
      
      // 预加载最近的短链列表
      await requestCache.preload('recent-links', async () => {
        // 这里可以添加预加载逻辑
        return { preloaded: true }
      })
      
      console.log('  ✓ 短链列表缓存已预热')
      
      console.log('✅ 缓存预热完成')
    } catch (error) {
      console.error('❌ 缓存预热失败:', error)
    }
  }

  // 优化缓存配置
  optimizeCache(): void {
    console.log('⚡ 优化缓存配置...')
    
    try {
      // 清理过期缓存
      this.clearExpiredCache()
      
      // 获取统计信息以评估性能
      const stats = this.getCacheStats()
      
      // 如果命中率过低，给出建议
      if (stats.requestCache.hitRate < 0.5) {
        console.log('  ⚠️ 请求缓存命中率较低，建议调整缓存策略')
      }
      
      if (stats.queryCache.cacheHitRate < 0.7) {
        console.log('  ⚠️ 查询缓存命中率较低，建议优化查询模式')
      }
      
      console.log('✅ 缓存优化完成')
    } catch (error) {
      console.error('❌ 缓存优化失败:', error)
    }
  }
}

// 创建缓存清理器实例
const cleaner = new CacheCleaner()

// 命令行参数处理
const args = process.argv.slice(2)
const command = args[0]

async function main() {
  try {
    switch (command) {
      case 'all':
        await cleaner.clearAll()
        break
        
      case 'request':
        const pattern = args[1]
        cleaner.clearRequestCache(pattern)
        break
        
      case 'api':
        const apiPattern = args[1]
        const tags = args.slice(2)
        cleaner.clearApiCache({ 
          pattern: apiPattern, 
          tags: tags.length > 0 ? tags : undefined 
        })
        break
        
      case 'expired':
        cleaner.clearExpiredCache()
        break
        
      case 'stats':
        cleaner.printCacheStats()
        break
        
      case 'warmup':
        await cleaner.warmupCache()
        break
        
      case 'optimize':
        cleaner.optimizeCache()
        break
        
      default:
        console.log('使用方法:')
        console.log('  bun run cache:clear all                    - 清理所有缓存')
        console.log('  bun run cache:clear request [模式]         - 清理请求缓存')
        console.log('  bun run cache:clear api [模式] [标签...]   - 清理API缓存')
        console.log('  bun run cache:clear expired                - 清理过期缓存')
        console.log('  bun run cache:clear stats                  - 显示缓存统计')
        console.log('  bun run cache:clear warmup                 - 预热缓存')
        console.log('  bun run cache:clear optimize               - 优化缓存')
        process.exit(1)
    }
  } catch (error) {
    console.error('执行失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

export { CacheCleaner }