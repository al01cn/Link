'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { 
  Activity, 
  Eye, 
  Plus, 
  AlertTriangle, 
  Calendar, 
  Filter, 
  Search, 
  X, 
  ChevronDown,
  ChevronRight,
  Clock,
  Globe,
  Monitor,
  TrendingUp,
  BarChart3,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { formatTimeAgo } from '@/lib/utils'
import { useConfirmDialog, useNotificationDialog } from '@/lib/useDialog'
import ConfirmDialog from './ConfirmDialog'
import NotificationDialog from './NotificationDialog'

/**
 * 日志类型枚举
 */
type LogType = 'visit' | 'create' | 'error' | 'prepare'

/**
 * 日志条目接口
 */
interface LogEntry {
  id: string
  type: LogType
  message: string
  details?: any
  ip?: string
  userAgent?: string
  createdAt: string
}

/**
 * 日志统计接口
 */
interface LogStats {
  total: number
  visitCount: number
  createCount: number
  errorCount: number
  todayCount: number
  last24Hours: Array<{
    hour: string
    count: number
  }>
}

/**
 * 日志查看组件属性接口
 */
interface LogsViewProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 日志查看组件
 * @description 显示系统日志，包括访问日志、短链生成日志和错误日志
 */
export default function LogsView({ isOpen, onClose }: LogsViewProps) {
  const { t, language } = useLanguage()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<LogType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'logs' | 'stats'>('logs')
  const [isCleaningLogs, setIsCleaningLogs] = useState(false)
  
  // 对话框 hooks
  const confirmDialog = useConfirmDialog()
  const notificationDialog = useNotificationDialog()

  // 加载日志数据
  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      })
      
      if (filterType !== 'all') {
        params.append('type', filterType)
      }

      const response = await fetch(`/api/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('获取日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载统计数据
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/logs/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  // 初始化数据
  useEffect(() => {
    if (isOpen) {
      fetchLogs()
      fetchStats()
    }
  }, [isOpen, filterType, currentPage])

  // 切换日志详情展开状态
  const toggleLogDetails = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  // 获取日志类型图标和颜色
  const getLogTypeInfo = (type: LogType) => {
    switch (type) {
      case 'visit':
        return {
          icon: Eye,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          label: t('visitLogs')
        }
      case 'create':
        return {
          icon: Plus,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          label: t('createLogs')
        }
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: t('errorLogs')
        }
      case 'prepare':
        return {
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
          label: t('prepareLogs')
        }
      default:
        return {
          icon: Activity,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          label: t('allLogs')
        }
    }
  }

  // 清理旧日志
  const cleanupLogs = async (days: number = 30) => {
    // 防止重复清理
    if (isCleaningLogs) return
    
    setIsCleaningLogs(true)
    try {
      const response = await fetch(`/api/logs/cleanup?days=${days}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        notificationDialog.notify({
          type: 'success',
          message: t('cleanupSuccess', { count: result.deletedCount })
        })
        // 重新加载数据
        fetchLogs()
        fetchStats()
      } else {
        notificationDialog.notify({
          type: 'error',
          message: t('cleanupFailed')
        })
      }
    } catch (error) {
      console.error('清理日志失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('cleanupFailed')
      })
    } finally {
      setIsCleaningLogs(false)
    }
  }

  // 筛选日志
  const filteredLogs = logs.filter(log => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        log.message.toLowerCase().includes(query) ||
        log.ip?.toLowerCase().includes(query) ||
        log.userAgent?.toLowerCase().includes(query)
      )
    }
    return true
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white">
              <Activity size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('systemLogsTitle')}</h2>
              <p className="text-sm text-gray-600">{t('systemLogsDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('logRecords')}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('statisticsAnalysis')}
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'logs' ? (
            <div className="h-full flex flex-col">
              {/* 筛选和搜索 */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* 搜索框 */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder={t('searchLogsPlaceholder')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* 类型筛选 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterType === 'all'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('allLogs')}
                    </button>
                    <button
                      onClick={() => setFilterType('visit')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                        filterType === 'visit'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Eye size={14} />
                      {t('visitLogs')}
                    </button>
                    <button
                      onClick={() => setFilterType('create')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                        filterType === 'create'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Plus size={14} />
                      {t('createLogs')}
                    </button>
                    <button
                      onClick={() => setFilterType('error')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                        filterType === 'error'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <AlertTriangle size={14} />
                      {t('errorLogs')}
                    </button>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        fetchLogs()
                        fetchStats()
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 bg-gray-100 text-gray-600 hover:bg-gray-200"
                      title={t('refreshLogsTitle')}
                    >
                      <RefreshCw size={14} />
                      {t('refreshLogs')}
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = await confirmDialog.confirm({
                          type: 'danger',
                          title: t('confirmCleanupTitle'),
                          message: t('confirmCleanupMessage'),
                          confirmText: t('confirmCleanup'),
                          cancelText: '取消'
                        })
                        
                        if (confirmed) {
                          cleanupLogs(30)
                        }
                      }}
                      disabled={isCleaningLogs}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t('cleanupLogsTitle')}
                    >
                      {isCleaningLogs ? (
                        <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      {t('cleanup')}
                    </button>
                  </div>
                </div>

                {/* 搜索结果统计 */}
                {(searchQuery || filterType !== 'all') && (
                  <div className="mt-3 text-sm text-gray-500">
                    {t('foundRecords', { count: filteredLogs.length })}
                    {searchQuery && ` (${t('searchLabel')}: "${searchQuery}")`}
                    {filterType !== 'all' && ` (${t('typeLabel')}: ${getLogTypeInfo(filterType as LogType).label})`}
                  </div>
                )}
              </div>

              {/* 日志列表 */}
              <div className="flex-1 overflow-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Activity size={48} className="mx-auto mb-4 opacity-50" />
                    <p>{t('noLogsRecord')}</p>
                    <p className="text-sm">{t('systemActivityWillShow')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLogs.map((log) => {
                      const typeInfo = getLogTypeInfo(log.type)
                      const isExpanded = expandedLogs.has(log.id)
                      const Icon = typeInfo.icon

                      return (
                        <div
                          key={log.id}
                          className={`border rounded-lg overflow-hidden ${typeInfo.borderColor}`}
                        >
                          {/* 日志头部 */}
                          <div
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${typeInfo.bgColor}`}
                            onClick={() => toggleLogDetails(log.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo.bgColor} ${typeInfo.color}`}>
                                  <Icon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                                      {typeInfo.label}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatTimeAgo(new Date(log.createdAt))}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-800 truncate">{log.message}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {log.ip && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {log.ip}
                                  </span>
                                )}
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </div>
                            </div>
                          </div>

                          {/* 日志详情 */}
                          {isExpanded && (
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">{t('time')}:</span>
                                  <span className="ml-2 text-gray-600">
                                    {new Date(log.createdAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                                  </span>
                                </div>
                                {log.ip && (
                                  <div>
                                    <span className="font-medium text-gray-700">IP地址:</span>
                                    <span className="ml-2 text-gray-600 font-mono">{log.ip}</span>
                                  </div>
                                )}
                                {log.userAgent && (
                                  <div className="md:col-span-2">
                                    <span className="font-medium text-gray-700">用户代理:</span>
                                    <span className="ml-2 text-gray-600 text-xs break-all">{log.userAgent}</span>
                                  </div>
                                )}
                                {log.details && (
                                  <div className="md:col-span-2">
                                    <span className="font-medium text-gray-700">详细信息:</span>
                                    <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 统计分析标签页 */
            <div className="p-6 overflow-auto">
              {stats ? (
                <div className="space-y-6">
                  {/* 统计卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                          <Eye size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">{t('visitLogsCount')}</p>
                          <p className="text-2xl font-bold text-blue-800">{stats.visitCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                          <Plus size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-green-600 font-medium">{t('createLogs')}</p>
                          <p className="text-2xl font-bold text-green-800">{stats.createCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-red-600 font-medium">{t('errorLogsCount')}</p>
                          <p className="text-2xl font-bold text-red-800">{stats.errorCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                          <TrendingUp size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-purple-600 font-medium">{t('todayActivity')}</p>
                          <p className="text-2xl font-bold text-purple-800">{stats.todayCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 24小时活动图表 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 size={20} />
                      {t('past24HoursActivity')}
                    </h3>
                    <div className="h-64 flex items-end justify-between gap-1">
                      {stats.last24Hours.map((item, index) => {
                        const maxCount = Math.max(...stats.last24Hours.map(h => h.count))
                        const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                        const hour = new Date(item.hour).getHours()
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                              style={{ height: `${height}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                              title={`${hour}:00 - ${t('recordsCount', { count: item.count })}`}
                            ></div>
                            <span className="text-xs text-gray-500 mt-1">
                              {hour}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 总体统计 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{t('overallStatistics')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                        <p className="text-gray-600">{t('totalLogsNumber')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">
                          {stats.total > 0 ? Math.round((stats.visitCount / stats.total) * 100) : 0}%
                        </p>
                        <p className="text-gray-600">{language === 'zh' ? '访问占比' : 'Visit Rate'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">
                          {stats.total > 0 ? Math.round((stats.errorCount / stats.total) * 100) : 0}%
                        </p>
                        <p className="text-gray-600">{language === 'zh' ? '错误率' : 'Error Rate'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 对话框组件 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.onClose}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
        type={confirmDialog.options.type}
      />
      <NotificationDialog
        isOpen={notificationDialog.isOpen}
        onClose={notificationDialog.onClose}
        title={notificationDialog.options.title}
        message={notificationDialog.options.message}
        type={notificationDialog.options.type}
        confirmText={notificationDialog.options.confirmText}
      />
    </div>
  )
}