import { PrismaClient } from '@prisma/client'

// 数据库连接池配置
interface DatabasePoolConfig {
  maxConnections: number
  connectionTimeout: number
  idleTimeout: number
  retryAttempts: number
  retryDelay: number
}

class DatabasePool {
  private static instance: DatabasePool
  private prisma: PrismaClient
  private config: DatabasePoolConfig
  private connectionCount = 0
  private isConnected = false

  private constructor() {
    this.config = {
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'), // 5分钟
      retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000')
    }

    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    // 连接事件监听
    this.setupEventListeners()
  }

  public static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool()
    }
    return DatabasePool.instance
  }

  private setupEventListeners(): void {
    // 进程退出时清理连接
    process.on('beforeExit', () => {
      this.disconnect()
    })

    process.on('SIGINT', () => {
      this.disconnect()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      this.disconnect()
      process.exit(0)
    })
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return

    try {
      console.log('🔌 正在建立数据库连接...')
      await this.prisma.$connect()
      this.isConnected = true
      console.log('✅ 数据库连接池已建立')
      console.log(`📊 连接配置: 最大连接数=${this.config.maxConnections}, 超时=${this.config.connectionTimeout}ms`)
    } catch (error) {
      console.error('❌ 数据库连接失败:', error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return

    try {
      await this.prisma.$disconnect()
      this.isConnected = false
      console.log('数据库连接池已关闭')
    } catch (error) {
      console.error('数据库断开连接失败:', error)
    }
  }

  public getClient(): PrismaClient {
    return this.prisma
  }

  // 带重试机制的查询执行
  public async executeWithRetry<T>(
    operation: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        if (!this.isConnected) {
          await this.connect()
        }
        
        return await operation(this.prisma)
      } catch (error) {
        lastError = error as Error
        console.warn(`数据库操作失败 (尝试 ${attempt}/${this.config.retryAttempts}):`, error)

        if (attempt < this.config.retryAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * attempt)
          )
        }
      }
    }

    throw lastError || new Error('数据库操作失败')
  }

  // 健康检查
  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('数据库健康检查失败:', error)
      return false
    }
  }

  // 获取连接统计信息
  public getStats(): {
    isConnected: boolean
    connectionCount: number
    config: DatabasePoolConfig
  } {
    return {
      isConnected: this.isConnected,
      connectionCount: this.connectionCount,
      config: this.config
    }
  }
}

// 导出单例实例
export const dbPool = DatabasePool.getInstance()
export const prisma = dbPool.getClient()

// 自动连接
if (process.env.NODE_ENV !== 'test') {
  dbPool.connect().catch(console.error)
}