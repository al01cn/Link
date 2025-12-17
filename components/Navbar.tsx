'use client'

import { Link2, Settings, Globe, Book, Activity } from 'lucide-react'
import { useState } from 'react'
import AdminDropdown from './AdminDropdown'
import ApiDocumentation from './ApiDocumentation'
import LogsView from './LogsView'
import { TranslationKey } from '@/lib/translations'

interface NavbarProps {
  onViewChange: (view: string) => void
  currentView: string
  lang: string
  toggleLang: () => void
  t: (key: TranslationKey) => string
}

export default function Navbar({ onViewChange, currentView, lang, toggleLang, t }: NavbarProps) {
  const [showApiDocs, setShowApiDocs] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  return (
    <>
      <ApiDocumentation isOpen={showApiDocs} onClose={() => setShowApiDocs(false)} />
      <LogsView isOpen={showLogs} onClose={() => setShowLogs(false)} />
    <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full z-10 relative">
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => onViewChange('home')}
      >
        <div className="w-8 h-8 bg-(--color-primary) rounded-lg flex items-center justify-center text-white font-bold shine-effect shadow-lg">
          <Link2 size={20} />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800">{t('appTitle')}</span>
      </div>
      
      <div className="flex gap-3">
        <button 
          onClick={toggleLang}
          className="cute-btn w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors relative"
          title={t('switchLanguage')}
        >
          <Globe size={18} />
          <span className="sr-only">{t('switchLanguage')}</span>
          <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-slate-200 px-1 rounded text-slate-600">
            {lang.toUpperCase()}
          </span>
        </button>

        <button 
          onClick={() => setShowApiDocs(true)}
          className="cute-btn px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 hover:bg-slate-100 text-slate-600"
          title="API 文档"
        >
          <Book size={18} />
          API
        </button>

        <button 
          onClick={() => setShowLogs(true)}
          className="cute-btn px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 hover:bg-slate-100 text-slate-600"
          title="系统日志"
        >
          <Activity size={18} />
          日志
        </button>
        
        <button 
          onClick={() => onViewChange('settings')}
          className={`cute-btn px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
            currentView === 'settings' ? 'bg-slate-200' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Settings size={18} />
          {t('settings')}
        </button>
        
        <AdminDropdown />
      </div>
    </nav>
    </>
  )
}