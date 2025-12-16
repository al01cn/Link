'use client'

import Link from 'next/link'
import { Link2, Home } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

export default function NotFound() {
  const t = useTranslation('zh') // 默认中文，实际项目中可以从context获取
  return (
    <div className="min-h-screen bg-[--color-bg-surface] preview-grid flex items-center justify-center p-4">
      <div className="cute-card max-w-md w-full p-8 text-center animate-fade-in">
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
            className="flex-1 shine-effect bg-[--color-primary] text-white px-6 py-3 rounded-xl font-medium hover:bg-[--color-primary-hover] transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
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