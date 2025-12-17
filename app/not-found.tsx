'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Link2, Home } from 'lucide-react'
import { useLanguage, LanguageProvider } from '@/lib/LanguageContext'

function NotFoundContent() {
  const [isClient, setIsClient] = useState(false)
  const { t } = useLanguage()
  
  // 客户端水合完成后启用动画
  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="min-h-screen bg-[--color-bg-surface] preview-grid flex items-center justify-center p-4">
      <div className={`cute-card max-w-md w-full p-8 text-center ${isClient ? 'animate-fade-in' : ''}`}>
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Link2 size={32} />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">{t('notFound')}</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          {t('notFoundDesc')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href="/"
            className="flex-1 shine-effect bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: 'var(--color-primary)'
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)'
            }}
          >
            <Home size={18} />
            {t('backHome')}
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="flex-1 px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            {t('goBack')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NotFound() {
  return (
    <LanguageProvider>
      <NotFoundContent />
    </LanguageProvider>
  )
}