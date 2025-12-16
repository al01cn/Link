'use client'

import { useState, useEffect } from 'react'
import { Link2, ArrowRight, Settings, ChevronDown, Lock, Shield, Zap, Eye, Copy, Trash2, X } from 'lucide-react'
import { formatTimeAgo } from '@/lib/utils'
import { TranslationKey } from '@/lib/translations'

interface ShortLink {
  id: number
  path: string
  shortUrl: string
  originalUrl: string
  title?: string
  views: number
  createdAt: string
  hasPassword: boolean
  requireConfirm: boolean
  enableIntermediate: boolean
}

interface HomeViewProps {
  onSimulateVisit: (link: ShortLink) => void
  t: (key: TranslationKey) => string
}

export default function HomeView({ onSimulateVisit, t }: HomeViewProps) {
  const [url, setUrl] = useState('')
  const [links, setLinks] = useState<ShortLink[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  
  // 密码弹窗状态
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)
  
  // 管理员验证弹窗状态
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const [currentLinkId, setCurrentLinkId] = useState<number | null>(null)
  const [adminError, setAdminError] = useState('')
  
  // 高级选项状态
  const [customPath, setCustomPath] = useState('')
  const [password, setPassword] = useState('')
  const [requireConfirm, setRequireConfirm] = useState(false)
  const [enableIntermediate, setEnableIntermediate] = useState(true)

  // 处理密码变化，有密码时自动开启二次确认和中间页
  useEffect(() => {
    if (password.trim()) {
      setRequireConfirm(true)
      setEnableIntermediate(true) // 有密码时必须启用中间页来显示密码输入框
    }
  }, [password])

  // 处理自动跳转开关变化
  const handleEnableIntermediateChange = (enabled: boolean) => {
    // 如果有密码，不允许禁用中间页
    if (!enabled && password.trim()) {
      return
    }
    setEnableIntermediate(enabled)
    if (enabled) {
      setRequireConfirm(false) // 开启自动跳转时关闭二次确认
    }
  }

  // 处理二次确认开关变化
  const handleRequireConfirmChange = (enabled: boolean) => {
    setRequireConfirm(enabled)
    if (enabled) {
      setEnableIntermediate(true) // 开启二次确认时必须启用中间页
    }
  }

  // 客户端水合完成后启用动画
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 加载短链列表
  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links')
      if (response.ok) {
        const data = await response.json()
        setLinks(data)
      }
    } catch (error) {
      console.error('获取短链列表失败:', error)
    }
  }

  const generateLink = async () => {
    if (!url) return
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: url,
          customPath: customPath || undefined,
          password: password || undefined,
          requireConfirm,
          enableIntermediate
        })
      })

      if (response.ok) {
        const newLink = await response.json()
        setLinks([newLink, ...links])
        
        // 重置表单
        setUrl('')
        setCustomPath('')
        setPassword('')
        setRequireConfirm(false)
        setEnableIntermediate(true)
        setShowAdvanced(false)
      } else {
        const error = await response.json()
        alert(error.error || t('generateFailed'))
      }
    } catch (error) {
      console.error('生成短链失败:', error)
      alert(t('generateFailed'))
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(id.toString())
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const deleteLink = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return
    
    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setLinks(links.filter(link => link.id !== id))
      } else {
        alert(t('deleteFailed'))
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert(t('deleteFailed'))
    }
  }

  const showPassword = (id: number) => {
    setCurrentLinkId(id)
    setAdminKey('')
    setAdminError('')
    setShowAdminModal(true)
  }

  const verifyAdminAndShowPassword = async () => {
    if (!adminKey.trim()) {
      setAdminError('请输入管理员密钥')
      return
    }

    if (!currentLinkId) return

    setLoadingPassword(true)
    setAdminError('')
    
    try {
      const response = await fetch(`/api/links/${currentLinkId}`, {
        headers: {
          'x-admin-key': adminKey
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // 检查是否真的有密码
        if (!data.hasPassword || !data.password) {
          setAdminError('该链接没有设置密码')
          return
        }
        
        setCurrentPassword(data.password)
        setShowAdminModal(false)
        setShowPasswordModal(true)
      } else {
        const errorData = await response.json()
        if (response.status === 403) {
          setAdminError('管理员密钥错误，无权限查看密码')
        } else {
          setAdminError(errorData.error || '获取密码失败')
        }
      }
    } catch (error) {
      console.error('获取密码失败:', error)
      setAdminError('网络错误，请重试')
    } finally {
      setLoadingPassword(false)
    }
  }

  const closeAdminModal = () => {
    setShowAdminModal(false)
    setAdminKey('')
    setAdminError('')
    setCurrentLinkId(null)
  }

  const closePasswordModal = () => {
    setShowPasswordModal(false)
    setCurrentPassword('')
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-20">
      
      {/* 标题区域 */}
      <div className={`text-center mt-12 mb-10 ${isClient ? 'animate__animated animate__fadeInDown' : ''}`}>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
          {t('heroTitle')}<span className="text-[var(--color-primary)]">{t('heroTitleHighlight')}</span> Links
        </h1>
        <p className="text-slate-500 text-lg">{t('heroDesc')}</p>
      </div>

      {/* 输入区域 */}
      <div className={`cute-card p-2 md:p-3 mb-8 shadow-xl shadow-blue-100/50 relative z-10 ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="cute-input-wrapper flex-1 bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3">
            <Link2 className="text-slate-400" />
            <input 
              type="text" 
              placeholder={t('inputPlaceholder')}
              className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 placeholder-slate-400"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateLink()}
            />
          </div>
          <button 
            onClick={generateLink}
            disabled={isGenerating || !url}
            className={`cute-btn shine-effect bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-[var(--color-primary-hover)] flex items-center justify-center gap-2 min-w-[140px] ${
              isGenerating || !url ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>{t('generate')} <ArrowRight size={20} /></>
            )}
          </button>
        </div>

        {/* 高级选项 */}
        <div className="mt-2 px-2">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-slate-500 hover:text-[var(--color-primary)] flex items-center gap-1 py-2 transition-colors"
          >
            <Settings size={14} />
            {showAdvanced ? t('collapseOptions') : t('advancedOptions')}
            <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* 可折叠面板 */}
          <div className={`grid gap-4 overflow-hidden transition-all duration-300 ease-out ${
            showAdvanced ? 'grid-rows-[1fr] opacity-100 pt-4 pb-2 border-t border-slate-100 mt-2' : 'grid-rows-[0fr] opacity-0 h-0'
          }`}>
            <div className="min-h-0 grid md:grid-cols-2 gap-4">
              
              {/* 自定义地址 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">{t('customAddress')}</label>
                <div className="cute-input-wrapper bg-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
                  <span className="text-slate-400">sh.rt/</span>
                  <input 
                    type="text" 
                    placeholder={t('customAddressPlaceholder')}
                    className="w-full outline-none text-slate-700"
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                  />
                </div>
              </div>

              {/* 访问密码 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">{t('password')}</label>
                <div className="cute-input-wrapper bg-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
                  <Lock size={14} className="text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={t('passwordPlaceholder')}
                    className="w-full outline-none text-slate-700"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* 开关选项 */}
              <div className="md:col-span-2 flex flex-col gap-3 mt-2">
                
                {/* 开启过渡页 */}
                <label className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                  password.trim() ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60' : 'border-slate-100 hover:bg-slate-50 cursor-pointer'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[var(--color-primary)] flex items-center justify-center">
                      <Zap size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{t('enableIntermediate')}</span>
                      {password.trim() && (
                        <span className="text-xs text-slate-400">设置密码时自动禁用</span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer sr-only cute-switch-checkbox" 
                      checked={enableIntermediate} 
                      disabled={password.trim() !== ''}
                      onChange={() => handleEnableIntermediateChange(!enableIntermediate)} 
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${
                      password.trim() ? 'bg-slate-300' : 'bg-slate-200 peer-checked:bg-[var(--color-primary)]'
                    }`}>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                    </div>
                  </div>
                </label>

                {/* 强制二次确认 */}
                <label className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                  password.trim() ? 'border-orange-200 bg-orange-50' : 'border-slate-100 hover:bg-slate-50'
                } cursor-pointer`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-[var(--color-warning)] flex items-center justify-center">
                      <Shield size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{t('enableConfirm')}</span>
                      {password.trim() && (
                        <span className="text-xs text-orange-500">设置密码时自动启用</span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer sr-only cute-switch-checkbox" 
                      checked={requireConfirm} 
                      onChange={() => handleRequireConfirmChange(!requireConfirm)} 
                    />
                    <div className="w-10 h-6 bg-slate-200 rounded-full transition-colors peer-checked:bg-[var(--color-primary)]">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                    </div>
                  </div>
                </label>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 短链列表 */}
      <div className="space-y-4">
        {links.map((link, idx) => (
          <div 
            key={link.id} 
            className={`cute-card p-4 flex flex-col md:flex-row items-center gap-4 ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}
            style={isClient ? { animationDelay: `${idx * 0.1}s` } : {}}
          >
            {/* 图标 */}
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400">
              {link.hasPassword ? <Lock size={20} className="text-[var(--color-warning)]" /> : 
               link.requireConfirm ? <Shield size={20} className="text-[var(--color-success)]" /> :
               <Zap size={20} className="text-[var(--color-primary)]" />}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0 text-center md:text-left w-full">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h3 
                  className="font-bold text-lg text-[var(--color-primary)] cursor-pointer hover:underline truncate"
                  onClick={() => onSimulateVisit(link)}
                >
                  {link.shortUrl}
                </h3>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 hidden md:inline-block">
                  {formatTimeAgo(new Date(link.createdAt))}
                </span>
              </div>
              <p className="text-sm text-slate-500 truncate max-w-md mx-auto md:mx-0">
                {link.title || link.originalUrl}
              </p>
            </div>

            {/* 统计和操作 */}
            <div className="flex items-center gap-6 text-slate-500 text-sm">
              <div className="flex items-center gap-1" title={t('views')}>
                <Eye size={16} />
                <span>{link.views}</span>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
                {/* 密码查看按钮 - 仅在有密码时显示 */}
                {link.hasPassword && (
                  <button 
                    className="p-2 hover:bg-orange-50 rounded-lg text-slate-500 hover:text-orange-600 transition-colors active:scale-95"
                    title="查看密码"
                    onClick={() => showPassword(link.id)}
                    disabled={loadingPassword}
                  >
                    {loadingPassword ? (
                      <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                )}
                <button 
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[var(--color-primary)] transition-colors active:scale-95"
                  title={copySuccess === link.id.toString() ? t('copied') : t('copy')}
                  onClick={() => copyToClipboard(link.shortUrl, link.id)}
                >
                  <Copy size={18} />
                </button>
                <button 
                  className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-[var(--color-error)] transition-colors active:scale-95"
                  title={t('delete')}
                  onClick={() => deleteLink(link.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {links.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Link2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t('noLinks')}</p>
            <p className="text-sm">{t('noLinksDesc')}</p>
          </div>
        )}
      </div>

      {/* 管理员验证弹窗 */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate__animated animate__fadeIn animate__faster">
            {/* 弹窗标题 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield size={20} className="text-blue-500" />
                管理员验证
              </h3>
              <button 
                onClick={closeAdminModal}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 说明文字 */}
            <p className="text-sm text-slate-600 mb-4">
              查看密码需要管理员权限，请输入管理员密钥：
            </p>

            {/* 密钥输入区域 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                管理员密钥
              </label>
              <div className={`cute-input-wrapper bg-slate-50 rounded-lg px-4 py-3 flex items-center gap-3 ${
                adminError ? 'border-red-300 ring-1 ring-red-300' : ''
              }`}>
                <Shield size={16} className="text-slate-400" />
                <input 
                  type="password" 
                  value={adminKey}
                  onChange={(e) => { setAdminKey(e.target.value); setAdminError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && !loadingPassword && verifyAdminAndShowPassword()}
                  className="flex-1 bg-transparent border-none outline-none text-slate-800"
                  placeholder="请输入管理员密钥"
                  disabled={loadingPassword}
                />
              </div>
              {adminError && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <X size={12} />
                  {adminError}
                </p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button 
                onClick={closeAdminModal}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                disabled={loadingPassword}
              >
                取消
              </button>
              <button 
                onClick={verifyAdminAndShowPassword}
                disabled={loadingPassword || !adminKey.trim()}
                className={`flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  loadingPassword || !adminKey.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loadingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    验证中...
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    验证并查看
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 密码显示弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate__animated animate__fadeIn animate__faster">
            {/* 弹窗标题 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Lock size={20} className="text-orange-500" />
                链接密码
              </h3>
              <button 
                onClick={closePasswordModal}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 密码显示区域 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                访问密码
              </label>
              <div className="cute-input-wrapper bg-slate-50 rounded-lg px-4 py-3 flex items-center gap-3">
                <Lock size={16} className="text-slate-400" />
                <input 
                  type="text" 
                  value={currentPassword}
                  readOnly
                  className="flex-1 bg-transparent border-none outline-none text-slate-800 font-mono"
                  placeholder={currentPassword ? "" : "密码获取中..."}
                />
                {currentPassword && (
                  <button 
                    onClick={() => copyToClipboard(currentPassword, -1)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-[var(--color-primary)] transition-colors"
                    title="复制密码"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
              {currentPassword && (
                <p className="text-xs text-slate-500 mt-2">
                  密码长度：{currentPassword.length} 个字符
                </p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end">
              <button 
                onClick={closePasswordModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}