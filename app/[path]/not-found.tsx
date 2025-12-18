'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, Home, X } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

export default function NotFound() {
  const { t } = useLanguage()
  const [countdown, setCountdown] = useState(10)
  const [showBackButton, setShowBackButton] = useState(false)
  
  // 检查是否来自主页
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer
      const currentOrigin = window.location.origin
      
      if (referrer && referrer.startsWith(currentOrigin)) {
        const referrerUrl = new URL(referrer)
        if (referrerUrl.pathname === '/') {
          setShowBackButton(true)
        }
      }
    }
  }, [])
  
  // 自动关闭倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.close()
      
      setTimeout(() => {
        if (showBackButton) {
          window.location.href = '/'
        }
      }, 100)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-bg-surface] p-4">
      <div className="cute-card max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          {t('linkExpired')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm leading-relaxed">
          {t('linkExpiredDesc')}
        </p>
        
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
          {t('autoCloseIn', { seconds: countdown })}
        </p>
        
        <div className="flex gap-3 justify-center">
          {showBackButton && (
            <Link 
              href="/"
              className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 flex items-center gap-2"
            >
              <Home size={16} />
              {t('backHome')}
            </Link>
          )}
          
          <button 
            onClick={handleClose}
            className="px-4 py-2 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 transition-colors text-sm flex items-center gap-2"
          >
            <X size={16} />
            {t('closeWindow')}
          </button>
        </div>
      </div>
    </div>
  )
}