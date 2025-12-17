'use client'

import { useState, useEffect } from 'react'
import { Settings, Shield, Clock, X, Check, Plus, Trash2 } from 'lucide-react'
import { TranslationKey } from '@/lib/translations'
import { useConfirmDialog, useNotificationDialog } from '@/lib/useDialog'
import ConfirmDialog from './ConfirmDialog'
import NotificationDialog from './NotificationDialog'

interface SettingsData {
  mode: 'whitelist' | 'blacklist'
  waitTime: number
  captchaEnabled: boolean
}

interface DomainRule {
  id: string
  domain: string
  type: 'whitelist' | 'blacklist'
  active: boolean
  createdAt: string
}

interface SettingsViewProps {
  onClose: () => void
  settings: SettingsData
  setSettings: (settings: SettingsData) => void
  t: (key: TranslationKey) => string
}

export default function SettingsView({ onClose, settings, setSettings, t }: SettingsViewProps) {
  const [newDomain, setNewDomain] = useState('')
  const [domainRules, setDomainRules] = useState<DomainRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // 对话框 hooks
  const confirmDialog = useConfirmDialog()
  const notificationDialog = useNotificationDialog()

  // 客户端水合完成后启用动画
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 加载设置和域名规则
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          mode: data.securityMode,
          waitTime: data.waitTime,
          captchaEnabled: data.captchaEnabled || false
        })
        setDomainRules(data.domainRules)
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 保存设置
  const saveSettings = async (newSettings: SettingsData) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          securityMode: newSettings.mode,
          waitTime: newSettings.waitTime,
          captchaEnabled: newSettings.captchaEnabled
        })
      })
      
      if (response.ok) {
        setSettings(newSettings)
      }
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  // 添加域名规则
  const addDomain = async () => {
    if (!newDomain.trim()) return
    
    setIsAddingDomain(true)
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: newDomain.trim(),
          type: settings.mode
        })
      })
      
      if (response.ok) {
        const newRule = await response.json()
        setDomainRules([newRule, ...domainRules])
        setNewDomain('')
      } else {
        const error = await response.json()
        notificationDialog.notify({
          type: 'error',
          message: error.error || '添加失败'
        })
      }
    } catch (error) {
      console.error('添加域名失败:', error)
      notificationDialog.notify({
        type: 'error',
        message: '添加失败'
      })
    } finally {
      setIsAddingDomain(false)
    }
  }

  // 删除域名规则
  const deleteDomain = async (id: string) => {
    const confirmed = await confirmDialog.confirm({
      type: 'danger',
      title: '确认删除',
      message: '确定要删除这个域名规则吗？',
      confirmText: '删除',
      cancelText: '取消'
    })
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/domains/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        // 成功删除，更新本地状态
        setDomainRules(domainRules.filter(rule => rule.id !== id))
        
        // 显示成功提示（可选）
        const result = await response.json()
        // console.log('删除成功:', result.message)
      } else {
        // 处理不同的错误状态码
        const errorData = await response.json()
        let errorMessage = '删除失败'
        
        switch (response.status) {
          case 400:
            errorMessage = `请求错误: ${errorData.error || '无效的请求参数'}`
            break
          case 404:
            errorMessage = `域名规则不存在: ${errorData.error || '记录未找到'}`
            // 即使是404，也从本地状态中移除（可能已被其他地方删除）
            setDomainRules(domainRules.filter(rule => rule.id !== id))
            break
          case 500:
            errorMessage = `服务器错误: ${errorData.error || '请稍后重试'}`
            break
          default:
            errorMessage = `删除失败 (${response.status}): ${errorData.error || '未知错误'}`
        }
        
        notificationDialog.notify({
          type: 'error',
          message: errorMessage
        })
        console.error('删除域名失败:', errorData)
      }
    } catch (error) {
      console.error('删除域名网络错误:', error)
      notificationDialog.notify({
        type: 'error',
        message: '网络错误，请检查连接后重试'
      })
    }
  }

  // 获取当前模式的域名列表
  const currentDomains = (domainRules || []).filter(rule => rule.type === settings.mode)

  return (
    <div className={`max-w-2xl mx-auto mt-10 pb-20 ${isClient ? 'animate__animated animate__fadeInUp' : ''}`}>
      <div className="cute-card p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="text-[var(--color-primary)]" />
            {t('systemSettings')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-10">
          
          {/* 安全模式选择 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield size={16} />
              {t('securityMode')}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  settings.mode === 'whitelist' ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, mode: 'whitelist' as 'whitelist' | 'blacklist'}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    settings.mode === 'whitelist' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {settings.mode === 'whitelist' && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700">{t('whitelist')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('whitelistDesc')}</p>
              </div>

              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  settings.mode === 'blacklist' ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, mode: 'blacklist' as 'whitelist' | 'blacklist'}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    settings.mode === 'blacklist' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {settings.mode === 'blacklist' && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700">{t('blacklist')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('blacklistDesc')}</p>
              </div>
            </div>
          </div>

          {/* 跳转等待时间 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock size={16} />
              {t('redirectWait')}
            </h3>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <p className="text-sm text-slate-500 flex-1">{t('redirectWaitDesc')}</p>
              <div className="cute-input-wrapper bg-white rounded-lg px-4 py-2 flex items-center gap-2 w-32">
                <input 
                  type="number" 
                  min="0"
                  max="60"
                  className="w-full bg-transparent outline-none text-slate-800 font-bold text-center"
                  value={settings.waitTime}
                  onChange={(e) => {
                    const newSettings = {...settings, waitTime: parseInt(e.target.value) || 0}
                    saveSettings(newSettings)
                  }}
                />
                <span className="text-slate-400 text-sm font-medium">{t('seconds')}</span>
              </div>
            </div>
          </div>

          {/* 人机验证设置 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield size={16} />
              {t('captchaSettings')}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  settings.captchaEnabled ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, captchaEnabled: true}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    settings.captchaEnabled ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {settings.captchaEnabled && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700">{t('enableCaptcha')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('captchaDesc')}</p>
              </div>

              <div 
                className={`option-card p-4 rounded-xl cursor-pointer bg-slate-50 relative ${
                  !settings.captchaEnabled ? 'active ring-2 ring-[var(--color-primary)]' : 'hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newSettings = {...settings, captchaEnabled: false}
                  saveSettings(newSettings)
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    !settings.captchaEnabled ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'
                  }`}>
                    {!settings.captchaEnabled && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-slate-700">{t('disableCaptcha')}</span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{t('captchaOffDesc')}</p>
              </div>
            </div>
          </div>

          {/* 域名列表 */}
          <div className={isClient ? 'animate__animated animate__fadeIn' : ''}>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
              {settings.mode === 'whitelist' ? t('whitelistDomains') : t('blacklistDomains')}
            </h3>
            
            {/* 添加域名输入框 */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="cute-input-wrapper flex-1 bg-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
                  <input 
                    type="text" 
                    placeholder="输入域名，如 example.com"
                    className="w-full outline-none text-slate-700"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isAddingDomain && addDomain()}
                    disabled={isAddingDomain}
                  />
                </div>
                <button 
                  onClick={addDomain}
                  disabled={isAddingDomain || !newDomain.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isAddingDomain || !newDomain.trim() 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                  }`}
                >
                  {isAddingDomain ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  {t('add')}
                </button>
              </div>
            </div>
            
            {/* 域名列表 */}
            <div className={`rounded-xl p-4 border ${
              settings.mode === 'whitelist' ? 'bg-slate-50 border-slate-100' : 'bg-red-50 border-red-100'
            }`}>
              {isLoading ? (
                <div className="text-center py-4 text-slate-400">
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-2" />
                  加载中...
                </div>
              ) : currentDomains.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentDomains.map(rule => (
                    <span 
                      key={rule.id} 
                      className={`bg-white px-3 py-1 rounded-full text-sm text-slate-600 border shadow-sm flex items-center gap-2 group hover:bg-slate-50 ${
                        settings.mode === 'whitelist' ? 'border-slate-200' : 'border-red-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        settings.mode === 'whitelist' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'
                      }`}></span>
                      {rule.domain}
                      <button
                        onClick={() => deleteDomain(rule.id)}
                        className="ml-1 p-1 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="删除"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Shield size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {settings.mode === 'whitelist' ? '白名单为空，将拦截所有域名' : '黑名单为空，允许所有域名'}
                  </p>
                  <p className="text-xs mt-1">在上方添加域名规则</p>
                </div>
              )}
            </div>
          </div>


        </div>
      </div>

      {/* 确认对话框 */}
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

      {/* 通知对话框 */}
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