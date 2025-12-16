'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import HomeView from '@/components/HomeView'
import SafeRedirectView from '@/components/SafeRedirectView'
import SettingsView from '@/components/SettingsView'
import { useTranslation, type Language } from '@/lib/translations'

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

export default function Home() {
  const [currentView, setCurrentView] = useState('home')
  const [redirectTarget, setRedirectTarget] = useState<ShortLink | null>(null)
  const [lang, setLang] = useState<Language>('zh')
  const [settings, setSettings] = useState({
    mode: 'whitelist' as 'whitelist' | 'blacklist',
    waitTime: 5
  })

  const t = useTranslation(lang)
  const toggleLang = () => setLang(prev => prev === 'zh' ? 'en' : 'zh')

  // 模拟访问短链
  const handleSimulateVisit = (link: ShortLink) => {
    // 逻辑：
    // 1. 有密码 或 需要确认 或 启用过渡页 -> 跳转到安全页面
    // 2. 否则直接跳转
    
    if (link.hasPassword || link.requireConfirm || link.enableIntermediate) {
      setRedirectTarget(link)
      setCurrentView('redirect')
    } else {
      // 直接跳转
      window.open(link.originalUrl, '_blank')
    }
  }

  // 处理跳转确认
  const handleProceed = async (password?: string) => {
    if (!redirectTarget) return

    try {
      const response = await fetch(`/api/visit/${redirectTarget.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        const data = await response.json()
        // 跳转到目标URL
        window.open(data.originalUrl, '_blank')
        setCurrentView('home')
        setRedirectTarget(null)
      } else {
        const error = await response.json()
        alert(error.error || t('accessFailed'))
      }
    } catch (error) {
      console.error('访问失败:', error)
      alert(t('accessFailed'))
    }
  }

  const handleCancel = () => {
    setCurrentView('home')
    setRedirectTarget(null)
  }

  return (
    <div className="min-h-screen bg-[--color-bg-surface] preview-grid">
      <Navbar 
        onViewChange={setCurrentView} 
        currentView={currentView} 
        lang={lang}
        toggleLang={toggleLang}
        t={t}
      />

      <main className="pt-6 pb-12">
        {currentView === 'home' && (
          <HomeView onSimulateVisit={handleSimulateVisit} t={t} />
        )}
        
        {currentView === 'settings' && (
          <SettingsView 
            onClose={() => setCurrentView('home')} 
            settings={settings}
            setSettings={setSettings}
            t={t}
          />
        )}

        {currentView === 'redirect' && redirectTarget && (
          <SafeRedirectView 
            targetUrl={redirectTarget.originalUrl} 
            title={redirectTarget.title}
            hasPassword={redirectTarget.hasPassword}
            requireConfirm={redirectTarget.requireConfirm}
            waitTime={settings.waitTime}
            onProceed={handleProceed}
            onCancel={handleCancel}
            t={t}
          />
        )}
      </main>

      {/* 页脚 */}
      <footer className="text-center py-8 text-slate-400 text-sm">
        <p>{t('footer')}</p>
      </footer>
    </div>
  )
}
