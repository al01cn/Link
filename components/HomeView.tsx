'use client'

import { useState, useEffect } from 'react'
import { Link2, ArrowRight, Settings, ChevronDown, Lock, Shield, Zap, Eye, Copy, Trash2 } from 'lucide-react'
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
  
  // 高级选项状态
  const [customPath, setCustomPath] = useState('')
  const [password, setPassword] = useState('')
  const [requireConfirm, setRequireConfirm] = useState(false)
  const [enableIntermediate, setEnableIntermediate] = useState(true)

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

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-20">
      
      {/* 标题区域 */}
      <div className="text-center mt-12 mb-10 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
          {t('heroTitle')}<span className="text-[--color-primary]">{t('heroTitleHighlight')}</span> Links
        </h1>
        <p className="text-slate-500 text-lg">{t('heroDesc')}</p>
      </div>

      {/* 输入区域 */}
      <div className="cute-card p-2 md:p-3 mb-8 shadow-xl shadow-blue-100/50 relative z-10 animate-fade-in">
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
            className={`cute-btn shine-effect bg-[--color-primary] text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-[--color-primary-hover] flex items-center justify-center gap-2 min-w-[140px] ${
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
            className="text-xs font-semibold text-slate-500 hover:text-[--color-primary] flex items-center gap-1 py-2 transition-colors"
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
                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[--color-primary] flex items-center justify-center">
                      <Zap size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{t('enableIntermediate')}</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer sr-only cute-switch-checkbox" 
                      checked={enableIntermediate} 
                      onChange={() => setEnableIntermediate(!enableIntermediate)} 
                    />
                    <div className="w-10 h-6 bg-slate-200 rounded-full transition-colors peer-checked:bg-[--color-primary]">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                    </div>
                  </div>
                </label>

                {/* 强制二次确认 */}
                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-[--color-warning] flex items-center justify-center">
                      <Shield size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{t('enableConfirm')}</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer sr-only cute-switch-checkbox" 
                      checked={requireConfirm} 
                      onChange={() => setRequireConfirm(!requireConfirm)} 
                    />
                    <div className="w-10 h-6 bg-slate-200 rounded-full transition-colors peer-checked:bg-[--color-primary]">
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
            className="cute-card p-4 flex flex-col md:flex-row items-center gap-4 animate-fade-in"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {/* 图标 */}
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
              {link.hasPassword ? <Lock size={20} className="text-[--color-warning]" /> : 
               link.requireConfirm ? <Shield size={20} className="text-[--color-success]" /> :
               <Zap size={20} className="text-[--color-primary]" />}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0 text-center md:text-left w-full">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h3 
                  className="font-bold text-lg text-[--color-primary] cursor-pointer hover:underline truncate"
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
                <button 
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[--color-primary] transition-colors active:scale-95"
                  title={copySuccess === link.id.toString() ? t('copied') : t('copy')}
                  onClick={() => copyToClipboard(link.shortUrl, link.id)}
                >
                  <Copy size={18} />
                </button>
                <button 
                  className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-[--color-error] transition-colors active:scale-95"
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
    </div>
  )
}