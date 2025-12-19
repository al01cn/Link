'use client'

import { useState, useEffect, useRef } from 'react'
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
  Shield,
  User,
  Settings,
  TrendingUp,
  BarChart3,
  Trash2,
  RefreshCw,
  Download,
  FileText,
  Database,
  Globe,
  Monitor,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import { formatTimeAgo } from '@/lib/utils'
import { useConfirmDialog, useNotificationDialog } from '@/lib/useDialog'
import ConfirmDialog from './ConfirmDialog'
import NotificationDialog from './NotificationDialog'

/**
 * 企业级日志类型枚举
 */
type EnhancedLogType = 'visit' | 'create' | 'error' | 'security' | 'admin' | 'system'

/**
 * 日志级别枚举
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

/**
 * 日志分类枚举
 */
type LogCategory = 'auth' | 'access' | 'operation' | 'security' | 'system' | 'general'

/**
 * 风险级别枚举
 */
type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

/**
 * 企业级日志条目接口
 */
interface EnhancedLogEntry {
  id: string
  type: EnhancedLogType
  level: LogLevel
  category: LogCategory
  message: string
  messageKey?: string
  messageParams?: string
  details?: any
  stackTrace?: string
  ip?: string
  userAgent?: string
  referer?: string
  requestId?: string
  sessionId?: string
  userId?: string
  username?: string
  action?: string
  resource?: string
  method?: string
  endpoint?: string
  statusCode?: number
  responseTime?: number
  riskLevel: RiskLevel
  tags?: string[]
  createdAt: string
}
/**
 * 日志查询参数接口
 */
interface LogQueryParams {
  type?: EnhancedLogType
  level?: LogLevel
  category?: LogCategory
  riskLevel?: RiskLevel
  startDate?: string
  endDate?: string
  search?: string
  ip?: string
  userId?: string
  action?: string
  resource?: string
  method?: string
  statusCode?: number
  tags?: string
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 日志响应接口
 */
interface LogsResponse {
  logs: EnhancedLogEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 企业级日志统计接口
 */
interface EnhancedLogStats {
  total: number
  todayCount: number
  yesterdayCount: number
  thisWeekCount: number
  thisMonthCount: number
  typeStats: Record<string, number>
  levelStats: Record<string, number>
  categoryStats: Record<string, number>
  riskLevelStats: Record<string, number>
  last24Hours: Array<{
    hour: string
    count: number
    errorCount: number
    securityCount: number
  }>
  last7Days: Array<{
    date: string
    count: number
    errorCount: number
    securityCount: number
  }>
  topIPs: Array<{
    ip: string
    count: number
    riskLevel: string
  }>
  topActions: Array<{
    action: string
    count: number
  }>
  topResources: Array<{
    resource: string
    count: number
  }>
  errorTrends: Array<{
    hour: string
    count: number
  }>
  securityEvents: Array<{
    type: string
    count: number
    riskLevel: string
  }>
  avgResponseTime: number
  slowRequests: number
}

/**
 * 企业级日志查看组件属性接口
 */
interface EnhancedLogsViewProps {
  isOpen: boolean
  onClose: () => void
}
/**
 * 企业级日志查看组件
 * @description 提供时间筛选、高级搜索、多维度分析等企业级日志功能
 */
export default function EnhancedLogsView({ isOpen, onClose }: EnhancedLogsViewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { t, language } = useLanguage()
  
  // 状态管理
  const [logs, setLogs] = useState<EnhancedLogEntry[]>([])
  const [stats, setStats] = useState<EnhancedLogStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'visit' | 'system' | 'stats'>('visit')
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // 查询参数
  const [queryParams, setQueryParams] = useState<LogQueryParams>({
    page: 1,
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  // 高级筛选状态
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [dateRange, setDateRange] = useState<{
    startDate: string
    endDate: string
  }>({
    startDate: '',
    endDate: ''
  })
  
  // 分页信息
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  })
  
  // 对话框 hooks
  const confirmDialog = useConfirmDialog()
  const notificationDialog = useNotificationDialog()

  // 初始化主题状态
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
  }, [])

  // 控制dialog的打开和关闭
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
      setIsDarkMode(document.documentElement.classList.contains('dark'))
      // 初始化数据
      fetchLogs()
      fetchStats()
    } else {
      dialog.close()
    }
  }, [isOpen])

  // 监听主题变化
  useEffect(() => {
    if (!isOpen) return

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'))
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [isOpen])
  // 获取日志数据
  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      // 基础参数
      params.append('page', queryParams.page.toString())
      params.append('limit', queryParams.limit.toString())
      params.append('sortBy', queryParams.sortBy || 'createdAt')
      params.append('sortOrder', queryParams.sortOrder || 'desc')
      
      // 根据当前标签页自动筛选日志类型
      if (activeTab === 'visit') {
        params.append('type', 'visit')
      } else if (activeTab === 'system') {
        // 系统日志：排除访问日志，显示其他所有类型
        params.append('excludeType', 'visit')
      }
      
      // 筛选参数
      if (queryParams.type && activeTab === 'system') params.append('type', queryParams.type) // 在系统日志页面允许进一步筛选类型
      if (queryParams.level) params.append('level', queryParams.level)
      if (queryParams.category) params.append('category', queryParams.category)
      if (queryParams.riskLevel) params.append('riskLevel', queryParams.riskLevel)
      if (queryParams.search) params.append('search', queryParams.search)
      if (queryParams.ip) params.append('ip', queryParams.ip)
      if (queryParams.userId) params.append('userId', queryParams.userId)
      if (queryParams.action) params.append('action', queryParams.action)
      if (queryParams.resource) params.append('resource', queryParams.resource)
      if (queryParams.method) params.append('method', queryParams.method)
      if (queryParams.statusCode) params.append('statusCode', queryParams.statusCode.toString())
      if (queryParams.tags) params.append('tags', queryParams.tags)
      
      // 时间范围参数
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/logs?${params}`)
      if (response.ok) {
        const data: LogsResponse = await response.json()
        setLogs(data.logs)
        setPaginationInfo({
          total: data.total,
          totalPages: data.totalPages,
          currentPage: data.page
        })
      } else {
        notificationDialog.notify({
          type: 'error',
          message: t('fetchLogDataFailed')
        })
      }
    } catch (error) {
      console.error('获取日志失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('fetchLogDataFailed')
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/logs/stats')
      if (response.ok) {
        const data: EnhancedLogStats = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  // 监听查询参数变化
  useEffect(() => {
    if (isOpen) {
      fetchLogs()
    }
  }, [queryParams, dateRange, activeTab, isOpen])

  // 更新查询参数
  const updateQueryParams = (updates: Partial<LogQueryParams>) => {
    setQueryParams(prev => ({
      ...prev,
      ...updates,
      page: updates.page !== undefined ? updates.page : 1 // 除非明确指定页码，否则重置到第一页
    }))
  }

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
  // 获取日志类型信息
  const getLogTypeInfo = (type: EnhancedLogType) => {
    switch (type) {
      case 'visit':
        return {
          icon: Eye,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          label: t('visitLog')
        }
      case 'create':
        return {
          icon: Plus,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          label: t('createLog')
        }
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: t('errorLog')
        }
      case 'security':
        return {
          icon: Shield,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
          label: t('securityLog')
        }
      case 'admin':
        return {
          icon: User,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          borderColor: 'border-purple-200',
          label: t('adminLog')
        }
      case 'system':
        return {
          icon: Settings,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          label: t('systemLog')
        }
      default:
        return {
          icon: Activity,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          label: t('unknownType')
        }
    }
  }

  // 获取日志级别信息
  const getLogLevelInfo = (level: LogLevel) => {
    switch (level) {
      case 'debug':
        return { icon: Info, color: 'text-gray-500', label: t('debugLevel') }
      case 'info':
        return { icon: CheckCircle, color: 'text-blue-500', label: t('infoLevel') }
      case 'warn':
        return { icon: AlertCircle, color: 'text-yellow-500', label: t('warnLevel') }
      case 'error':
        return { icon: XCircle, color: 'text-red-500', label: t('errorLevel') }
      case 'critical':
        return { icon: AlertTriangle, color: 'text-red-700', label: t('criticalLevel') }
      default:
        return { icon: Info, color: 'text-gray-500', label: t('unknownLevel') }
    }
  }

  // 获取风险级别信息
  const getRiskLevelInfo = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'low':
        return { color: 'text-green-600', bgColor: 'bg-green-100', label: t('lowRisk') }
      case 'medium':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: t('mediumRisk') }
      case 'high':
        return { color: 'text-orange-600', bgColor: 'bg-orange-100', label: t('highRisk') }
      case 'critical':
        return { color: 'text-red-600', bgColor: 'bg-red-100', label: t('criticalRisk') }
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', label: t('unknownRisk') }
    }
  }

  // 获取操作翻译
  const getActionTranslation = (action: string) => {
    const actionMap: Record<string, string> = {
      'create_link': t('createLink'),
      'visit_link': t('visitLink'),
      'delete_link': t('deleteLink'),
      'admin_login': t('adminLogin'),
      'change_password': t('changePassword'),
      'export_config': t('exportConfig'),
      'import_config': t('importConfig'),
      'add_domain': t('addDomain'),
      'delete_domain': t('deleteDomain'),
      'prepare_redirect': t('prepareRedirect'),
      'track_visit': t('trackVisit'),
      'verify_password': t('verifyPassword'),
      'cleanup_logs': t('cleanupLogs'),
      'export_logs': t('exportLogs'),
      // 额外的操作翻译
      'create': t('create'),
      'visit': t('visit'),
      'unauthorized_access': t('unauthorizedAccess'),
      'suspicious_activity': t('suspiciousActivity'),
      'delete_chain_link': t('deleteChainLink'),
      'update_link': t('updateLink'),
      'system_maintenance': t('systemMaintenance'),
      'security_scan': t('securityScan'),
      'data_backup': t('dataBackup'),
      'config_update': t('configUpdate')
    }
    return actionMap[action] || action
  }
  // 导出日志
  const exportLogs = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams()
      params.append('format', format)
      
      if (queryParams.type) params.append('type', queryParams.type)
      if (queryParams.level) params.append('level', queryParams.level)
      if (queryParams.category) params.append('category', queryParams.category)
      if (queryParams.riskLevel) params.append('riskLevel', queryParams.riskLevel)
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)
      
      const response = await fetch(`/api/logs/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `logs_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        notificationDialog.notify({
          type: 'success',
          message: t('logExportedAs', { format: format.toUpperCase() })
        })
      } else {
        notificationDialog.notify({
          type: 'error',
          message: t('exportLogsFailed')
        })
      }
    } catch (error) {
      console.error('导出日志失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('exportLogsFailed')
      })
    }
  }

  // 清理旧日志
  const cleanupLogs = async (days: number = 30) => {
    try {
      const response = await fetch(`/api/logs/cleanup?days=${days}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        notificationDialog.notify({
          type: 'success',
          message: t('cleanedLogRecords', { deletedCount: result.deletedCount })
        })
        fetchLogs()
        fetchStats()
      } else {
        notificationDialog.notify({
          type: 'error',
          message: t('cleanupLogsFailed')
        })
      }
    } catch (error) {
      console.error('清理日志失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: t('cleanupLogsFailed')
      })
    }
  }

  // 快速时间范围选择
  const setQuickDateRange = (range: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth') => {
    const now = new Date()
    
    // 使用本地时区的日期格式化函数
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (range) {
      case 'today':
        setDateRange({
          startDate: formatLocalDate(today),
          endDate: formatLocalDate(today)
        })
        break
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        setDateRange({
          startDate: formatLocalDate(yesterday),
          endDate: formatLocalDate(yesterday)
        })
        break
      case 'last7days':
        const last7days = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000) // 包含今天，所以是6天前
        setDateRange({
          startDate: formatLocalDate(last7days),
          endDate: formatLocalDate(today)
        })
        break
      case 'last30days':
        const last30days = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000) // 包含今天，所以是29天前
        setDateRange({
          startDate: formatLocalDate(last30days),
          endDate: formatLocalDate(today)
        })
        break
      case 'thisMonth':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        setDateRange({
          startDate: formatLocalDate(monthStart),
          endDate: formatLocalDate(today)
        })
        break
    }
  }
  return (
    <dialog 
      ref={dialogRef}
      className="backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-transparent rounded-lg w-full max-w-7xl h-[95vh] p-0"
      onClose={onClose}
    >
      <div className={`rounded-lg shadow-xl w-full h-full flex flex-col border ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-600' : 'bg-white text-gray-900 border-gray-200'}`}>
        {/* 头部 */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white">
              <Database size={18} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                {t('enterpriseLogSystem')}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                {t('securityAuditTimeFilterAdvancedAnalysis')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* 标签页导航 */}
        <div className={`flex border-b ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('visit')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'visit'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            <Eye size={16} />
            {t('visitLogsCount')}
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'system'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            <Settings size={16} />
            {t('systemLogsTitle')}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 size={16} />
            {t('statisticsAnalysis')}
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {(activeTab === 'visit' || activeTab === 'system') && (
            <div className="h-full flex flex-col">
              {/* 搜索和筛选工具栏 */}
              <div className={`p-4 border-b space-y-4 ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                {/* 第一行：搜索框和快速筛选 */}
                <div className="flex flex-col lg:flex-row gap-3">
                  {/* 搜索框 */}
                  <div className="flex-1 relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} size={18} />
                    <input
                      type="text"
                      placeholder={t('searchLogContentIpUsername')}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'border-slate-600 bg-slate-800 text-slate-200' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      value={queryParams.search || ''}
                      onChange={(e) => updateQueryParams({ search: e.target.value || undefined })}
                    />
                    {queryParams.search && (
                      <button
                        onClick={() => updateQueryParams({ search: undefined })}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                          isDarkMode 
                            ? 'text-slate-500 hover:text-slate-300' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* 高级筛选切换 */}
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      showAdvancedFilters
                        ? `${isDarkMode ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-purple-100 text-purple-700 border border-purple-200'}`
                        : `${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                    }`}
                  >
                    <Filter size={16} />
                    {t('advancedFilter')}
                    {showAdvancedFilters ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
                {/* 高级筛选面板 */}
                {showAdvancedFilters && (
                  <div className={`p-4 rounded-lg border space-y-4 ${
                    isDarkMode 
                      ? 'bg-slate-800/50 border-slate-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    {/* 时间范围选择 */}
                    <div className="space-y-2">
                      <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                        {t('timeRange')}
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          { key: 'today', label: t('today') },
                          { key: 'yesterday', label: t('yesterday') },
                          { key: 'last7days', label: t('last7Days') },
                          { key: 'last30days', label: t('last30Days') },
                          { key: 'thisMonth', label: t('thisMonth') }
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setQuickDateRange(key as any)}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              isDarkMode 
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {t('startDate')}
                          </label>
                          <input
                            type="date"
                            className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm ${
                              isDarkMode 
                                ? 'border-slate-600 bg-slate-800 text-slate-200' 
                                : 'border-gray-300 bg-white text-gray-900'
                            }`}
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                        </div>
                        <div className="flex-1">
                          <label className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {t('endDate')}
                          </label>
                          <input
                            type="date"
                            className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm ${
                              isDarkMode 
                                ? 'border-slate-600 bg-slate-800 text-slate-200' 
                                : 'border-gray-300 bg-white text-gray-900'
                            }`}
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 筛选条件 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* 日志类型 - 只在系统日志标签页显示 */}
                      {activeTab === 'system' && (
                        <div>
                          <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                            {t('logType')}
                          </label>
                          <select
                            className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm ${
                              isDarkMode 
                                ? 'border-slate-600 bg-slate-800 text-slate-200' 
                                : 'border-gray-300 bg-white text-gray-900'
                            }`}
                            value={queryParams.type || ''}
                            onChange={(e) => updateQueryParams({ type: e.target.value as EnhancedLogType || undefined })}
                          >
                            <option value="">{t('allSystemTypes')}</option>
                            <option value="create">{t('createLog')}</option>
                            <option value="error">{t('errorLog')}</option>
                            <option value="security">{t('securityLog')}</option>
                            <option value="admin">{t('adminLog')}</option>
                            <option value="system">{t('systemLog')}</option>
                          </select>
                        </div>
                      )}

                      {/* 日志级别 */}
                      <div>
                        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                          {t('logLevel')}
                        </label>
                        <select
                          className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm ${
                            isDarkMode 
                              ? 'border-slate-600 bg-slate-800 text-slate-200' 
                              : 'border-gray-300 bg-white text-gray-900'
                          }`}
                          value={queryParams.level || ''}
                          onChange={(e) => updateQueryParams({ level: e.target.value as LogLevel || undefined })}
                        >
                          <option value="">{t('allLevels')}</option>
                          <option value="debug">{t('debugLevel')}</option>
                          <option value="info">{t('infoLevel')}</option>
                          <option value="warn">{t('warnLevel')}</option>
                          <option value="error">{t('errorLevel')}</option>
                          <option value="critical">{t('criticalLevel')}</option>
                        </select>
                      </div>

                      {/* 风险级别 */}
                      <div>
                        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                          {t('riskLevel')}
                        </label>
                        <select
                          className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm ${
                            isDarkMode 
                              ? 'border-slate-600 bg-slate-800 text-slate-200' 
                              : 'border-gray-300 bg-white text-gray-900'
                          }`}
                          value={queryParams.riskLevel || ''}
                          onChange={(e) => updateQueryParams({ riskLevel: e.target.value as RiskLevel || undefined })}
                        >
                          <option value="">{t('allRisks')}</option>
                          <option value="low">{t('lowRisk')}</option>
                          <option value="medium">{t('mediumRisk')}</option>
                          <option value="high">{t('highRisk')}</option>
                          <option value="critical">{t('criticalRisk')}</option>
                        </select>
                      </div>

                      {/* IP地址 */}
                      <div>
                        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                          {t('ipAddressFilter')}
                        </label>
                        <input
                          type="text"
                          placeholder={t('filterIpAddress')}
                          className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm ${
                            isDarkMode 
                              ? 'border-slate-600 bg-slate-800 text-slate-200' 
                              : 'border-gray-300 bg-white text-gray-900'
                          }`}
                          value={queryParams.ip || ''}
                          onChange={(e) => updateQueryParams({ ip: e.target.value || undefined })}
                        />
                      </div>
                    </div>

                    {/* 清除筛选 */}
                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => {
                          setQueryParams({
                            page: 1,
                            limit: 50,
                            sortBy: 'createdAt',
                            sortOrder: 'desc'
                          })
                          setDateRange({ startDate: '', endDate: '' })
                        }}
                        className={`text-sm px-3 py-1 rounded transition-colors ${
                          isDarkMode 
                            ? 'text-slate-400 hover:text-slate-200' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {t('clearAllFilters')}
                      </button>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => exportLogs('csv')}
                          className="px-3 py-1 text-sm rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center gap-1"
                        >
                          <Download size={14} />
                          {t('exportCsv')}
                        </button>
                        <button
                          onClick={() => exportLogs('json')}
                          className="px-3 py-1 text-sm rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1"
                        >
                          <Download size={14} />
                          {t('exportJson')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        fetchLogs()
                        fetchStats()
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      <RefreshCw size={14} />
                      {t('refresh')}
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = await confirmDialog.confirm({
                          type: 'danger',
                          title: t('confirmCleanupLogs'),
                          message: t('cleanupLogsMessage'),
                          confirmText: t('confirmCleanup'),
                          cancelText: t('cancel')
                        })
                        
                        if (confirmed) {
                          cleanupLogs(30)
                        }
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      <Trash2 size={14} />
                      {t('cleanupOldLogs')}
                    </button>
                  </div>

                  {/* 分页信息 */}
                  <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t('totalRecordsPageInfo', { 
                      total: paginationInfo.total, 
                      currentPage: paginationInfo.currentPage, 
                      totalPages: paginationInfo.totalPages 
                    })}
                  </div>
                </div>
              </div>
              {/* 日志列表 */}
              <div className="flex-1 overflow-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Database size={48} className="mx-auto mb-4 opacity-50" />
                    <p>{t('noLogRecords')}</p>
                    <p className="text-sm">{t('systemActivityWillShow')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => {
                      const typeInfo = getLogTypeInfo(log.type)
                      const levelInfo = getLogLevelInfo(log.level)
                      const riskInfo = getRiskLevelInfo(log.riskLevel)
                      const isExpanded = expandedLogs.has(log.id)
                      const TypeIcon = typeInfo.icon
                      const LevelIcon = levelInfo.icon

                      return (
                        <div
                          key={log.id}
                          className={`border rounded-lg overflow-hidden ${typeInfo.borderColor} ${
                            log.riskLevel === 'critical' ? 'ring-2 ring-red-200' : 
                            log.riskLevel === 'high' ? 'ring-1 ring-orange-200' : ''
                          }`}
                        >
                          {/* 日志头部 */}
                          <div
                            className={`p-4 cursor-pointer transition-colors ${
                              isDarkMode 
                                ? 'hover:bg-slate-700/50 bg-slate-800/30' 
                                : `hover:bg-gray-50 ${typeInfo.bgColor}`
                            }`}
                            onClick={() => toggleLogDetails(log.id)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeInfo.bgColor} ${typeInfo.color}`}>
                                  <TypeIcon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                                      {typeInfo.label}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                                      isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      <LevelIcon size={12} className={levelInfo.color} />
                                      {levelInfo.label}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${riskInfo.bgColor} ${riskInfo.color}`}>
                                      {riskInfo.label}
                                    </span>
                                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                      {formatTimeAgo(new Date(log.createdAt), language)}
                                    </span>
                                  </div>
                                  <p className={`text-sm wrap-break-word ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>
                                    {(() => {
                                      // 动态翻译日志消息
                                      let displayMessage = log.message
                                      
                                      // 如果有 messageKey，使用动态翻译
                                      if (log.messageKey) {
                                        try {
                                          const params = log.messageParams ? JSON.parse(log.messageParams) : {}
                                          displayMessage = t(log.messageKey as any, params)
                                        } catch (error) {
                                          console.error('解析日志消息参数失败:', error)
                                          displayMessage = log.message
                                        }
                                      }
                                      
                                      return displayMessage.length > 120 ? `${displayMessage.substring(0, 120)}...` : displayMessage
                                    })()}
                                  </p>
                                  
                                  {/* 快速信息 */}
                                  <div className="flex items-center gap-4 mt-2 text-xs">
                                    {log.action && (
                                      <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {t('operation')}: {log.action}
                                      </span>
                                    )}
                                    {log.resource && (
                                      <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {t('resource')}: {log.resource}
                                      </span>
                                    )}
                                    {log.statusCode && (
                                      <span className={`px-1 py-0.5 rounded font-mono ${
                                        log.statusCode >= 200 && log.statusCode < 300 
                                          ? 'bg-green-100 text-green-700'
                                          : log.statusCode >= 400 
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {log.statusCode}
                                      </span>
                                    )}
                                    {log.responseTime && (
                                      <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {log.responseTime}ms
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {log.ip && (
                                  <span className={`text-xs px-2 py-1 rounded font-mono ${
                                    isDarkMode 
                                      ? 'text-slate-200 bg-slate-700' 
                                      : 'text-gray-600 bg-gray-100'
                                  }`}>
                                    {log.ip.length > 15 ? `${log.ip.substring(0, 12)}...` : log.ip}
                                  </span>
                                )}
                                <div className={`${isDarkMode ? 'text-slate-300' : 'text-gray-400'}`}>
                                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 日志详情 */}
                          {isExpanded && (
                            <div className={`p-4 border-t ${
                              isDarkMode 
                                ? 'bg-slate-800/50 border-slate-600' 
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {/* 完整消息 */}
                                <div className="md:col-span-2">
                                  <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                    {t('fullMessage')}:
                                  </span>
                                  <p className={`mt-1 wrap-break-word ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                    {(() => {
                                      let displayMessage = log.message
                                      if (log.messageKey) {
                                        try {
                                          const params = log.messageParams ? JSON.parse(log.messageParams) : {}
                                          displayMessage = t(log.messageKey as any, params)
                                        } catch (error) {
                                          console.error('解析日志消息参数失败:', error)
                                          displayMessage = log.message
                                        }
                                      }
                                      return displayMessage
                                    })()}
                                  </p>
                                </div>
                                
                                {/* 基础信息 */}
                                <div>
                                  <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                    {t('time')}:
                                  </span>
                                  <span className={`ml-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                    {new Date(log.createdAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                                  </span>
                                </div>
                                
                                {log.requestId && (
                                  <div>
                                    <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                      {t('requestId')}:
                                    </span>
                                    <span className={`ml-2 font-mono text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                      {log.requestId}
                                    </span>
                                  </div>
                                )}
                                
                                {log.userId && (
                                  <div>
                                    <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                      {t('userId')}:
                                    </span>
                                    <span className={`ml-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                      {log.userId}
                                    </span>
                                  </div>
                                )}
                                
                                {log.username && (
                                  <div>
                                    <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                      {t('username')}:
                                    </span>
                                    <span className={`ml-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                      {log.username}
                                    </span>
                                  </div>
                                )}

                                {log.ip && (
                                  <div>
                                    <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                      {t('ipAddress')}:
                                    </span>
                                    <span className={`ml-2 font-mono break-all ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                      {log.ip}
                                    </span>
                                  </div>
                                )}

                                {log.method && (
                                  <div>
                                    <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                      {t('httpMethod')}:
                                    </span>
                                    <span className={`ml-2 font-mono ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                      {log.method}
                                    </span>
                                  </div>
                                )}

                                {log.endpoint && (
                                  <div className="md:col-span-2">
                                    <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                      {t('endpoint')}:
                                    </span>
                                    <span className={`ml-2 font-mono break-all ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                      {log.endpoint}
                                    </span>
                                  </div>
                                )}

                                {log.userAgent && (
                                  <div className="md:col-span-2">
                                    <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                      {t('userAgent')}:
                                    </span>
                                    <p className={`mt-1 text-xs break-all ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                      {log.userAgent}
                                    </p>
                                  </div>
                                )}

                                {log.tags && log.tags.length > 0 && (
                                  <div className="md:col-span-2">
                                    <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                      {t('tags')}:
                                    </span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {log.tags.map((tag, index) => (
                                        <span
                                          key={index}
                                          className={`px-2 py-1 text-xs rounded ${
                                            isDarkMode 
                                              ? 'bg-slate-700 text-slate-300' 
                                              : 'bg-gray-200 text-gray-700'
                                          }`}
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {log.details && (
                                  <div className="md:col-span-2">
                                    <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                      {t('detailInfo')}:
                                    </span>
                                    <pre className={`mt-2 p-3 rounded text-xs overflow-x-auto ${
                                      isDarkMode 
                                        ? 'bg-slate-900 text-slate-100' 
                                        : 'bg-gray-900 text-gray-100'
                                    }`}>
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {log.stackTrace && (
                                  <div className="md:col-span-2">
                                    <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                      {t('errorStack')}:
                                    </span>
                                    <pre className={`mt-2 p-3 rounded text-xs overflow-x-auto ${
                                      isDarkMode 
                                        ? 'bg-red-900/20 text-red-100' 
                                        : 'bg-red-50 text-red-800'
                                    }`}>
                                      {log.stackTrace}
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

                {/* 分页控件 */}
                {paginationInfo.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => updateQueryParams({ page: Math.max(1, queryParams.page - 1) })}
                      disabled={queryParams.page <= 1}
                      className="px-3 py-2 text-sm rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {t('previousPage')}
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <button
                            key={page}
                            onClick={() => updateQueryParams({ page })}
                            className={`px-3 py-2 text-sm rounded-lg ${
                              page === queryParams.page
                                ? 'bg-purple-500 text-white'
                                : 'border hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => updateQueryParams({ page: Math.min(paginationInfo.totalPages, queryParams.page + 1) })}
                      disabled={queryParams.page >= paginationInfo.totalPages}
                      className="px-3 py-2 text-sm rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {t('nextPage')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* 统计分析标签页 */}
          {activeTab === 'stats' && (
            <div className="p-6 overflow-auto">
              {stats ? (
                <div className="space-y-6">
                  {/* 概览统计卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                          <Database size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">{t('totalLogs')}</p>
                          <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-green-600 font-medium">{t('todayActivity')}</p>
                          <p className="text-2xl font-bold text-green-800">{stats.todayCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-white">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-yellow-600 font-medium">{t('weekActivity')}</p>
                          <p className="text-2xl font-bold text-yellow-800">{stats.thisWeekCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-purple-50 border-purple-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                          <TrendingUp size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-purple-600 font-medium">{t('monthActivity')}</p>
                          <p className="text-2xl font-bold text-purple-800">{stats.thisMonthCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-red-600 font-medium">{t('slowRequests')}</p>
                          <p className="text-2xl font-bold text-red-800">{stats.slowRequests}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 统计图表 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 日志类型分布 */}
                    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                      <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                        {t('logTypeDistribution')}
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(stats.typeStats).map(([type, count]) => {
                          const typeInfo = getLogTypeInfo(type as EnhancedLogType)
                          const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                          return (
                            <div key={type} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${typeInfo.bgColor}`}></div>
                                <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                  {typeInfo.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                                  {count}
                                </span>
                                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                  ({percentage}%)
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* 风险级别分布 */}
                    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                      <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                        {t('riskLevelDistribution')}
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(stats.riskLevelStats).map(([riskLevel, count]) => {
                          const riskInfo = getRiskLevelInfo(riskLevel as RiskLevel)
                          const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                          return (
                            <div key={riskLevel} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${riskInfo.bgColor}`}></div>
                                <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                  {riskInfo.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                                  {count}
                                </span>
                                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                  ({percentage}%)
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 热点统计 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 热点IP */}
                    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                      <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                        {t('hotIpAddresses')}
                      </h3>
                      <div className="space-y-2">
                        {stats.topIPs.slice(0, 5).map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className={`text-sm font-mono ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                              {item.ip}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                                {item.count}
                              </span>
                              <span className={`px-1 py-0.5 text-xs rounded ${getRiskLevelInfo(item.riskLevel as RiskLevel).bgColor} ${getRiskLevelInfo(item.riskLevel as RiskLevel).color}`}>
                                {getRiskLevelInfo(item.riskLevel as RiskLevel).label}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 热点操作 */}
                    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                      <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                        {t('hotOperations')}
                      </h3>
                      <div className="space-y-2">
                        {stats.topActions.slice(0, 5).map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                              {getActionTranslation(item.action)}
                            </span>
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                              {item.count}
                            </span>
                          </div>
                        ))}
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

          {/* 趋势分析标签页 - 暂时注释掉，因为activeTab类型中没有'analysis' */}
          {/* 
          {activeTab === 'analysis' && (
            <div className="p-6 overflow-auto">
              {stats ? (
                <div className="space-y-6">
                  24小时趋势
                  <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                      <BarChart3 size={20} />
                      {t('past24HoursTrend')}
                    </h3>
                    <div className="h-64 flex items-end justify-between gap-1">
                      {stats.last24Hours.map((item, index) => {
                        const maxCount = Math.max(...stats.last24Hours.map(h => h.count))
                        const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                        const hour = new Date(item.hour).getHours()
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex flex-col">
                              安全事件
                              {item.securityCount > 0 && (
                                <div
                                  className="w-full bg-red-500 rounded-t transition-all hover:bg-red-600"
                                  style={{ 
                                    height: `${maxCount > 0 ? (item.securityCount / maxCount) * 100 : 0}%`,
                                    minHeight: '2px'
                                  }}
                                  title={`${hour}:00 - 安全事件: ${item.securityCount}`}
                                ></div>
                              )}
                              错误事件
                              {item.errorCount > 0 && (
                                <div
                                  className="w-full bg-orange-500 transition-all hover:bg-orange-600"
                                  style={{ 
                                    height: `${maxCount > 0 ? (item.errorCount / maxCount) * 100 : 0}%`,
                                    minHeight: '2px'
                                  }}
                                  title={`${hour}:00 - 错误: ${item.errorCount}`}
                                ></div>
                              )}
                              正常活动
                              <div
                                className="w-full bg-blue-500 rounded-b transition-all hover:bg-blue-600"
                                style={{ 
                                  height: `${height}%`,
                                  minHeight: item.count > 0 ? '4px' : '0'
                                }}
                                title={`${hour}:00 - 总计: ${item.count}`}
                              ></div>
                            </div>
                            <span className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              {hour}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>{t('normalActivity')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded"></div>
                        <span className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>{t('errorEvents')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>{t('securityEvents')}</span>
                      </div>
                    </div>
                  </div>

                  7天趋势
                  <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                      <TrendingUp size={20} />
                      {t('past7DaysTrend')}
                    </h3>
                    <div className="h-48 flex items-end justify-between gap-2">
                      {stats.last7Days.map((item, index) => {
                        const maxCount = Math.max(...stats.last7Days.map(d => d.count))
                        const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                        const date = new Date(item.date)
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-gradient-to-t from-purple-500 to-blue-500 rounded-t transition-all hover:from-purple-600 hover:to-blue-600"
                              style={{ height: `${height}%`, minHeight: item.count > 0 ? '8px' : '0' }}
                              title={`${date.toLocaleDateString()} - 总计: ${item.count}`}
                            ></div>
                            <span className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              {date.getMonth() + 1}/{date.getDate()}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  性能指标
                  <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                      {t('performanceMetrics')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">
                          {Math.round(stats.avgResponseTime)}ms
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          {t('avgResponseTime')}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-red-600">
                          {stats.slowRequests}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          {t('slowRequestCount')}
                        </p>
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
          */}
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
    </dialog>
  )
}