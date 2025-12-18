'use client'

import { useState, useRef, useEffect } from 'react'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAdmin } from '@/lib/AdminContext'
import { useLanguage } from '@/lib/LanguageContext'
import { useTheme } from '@/lib/ThemeContext'
import AdminSettings from './AdminSettings'

export default function AdminDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { username, logout } = useAdmin()
  const { t } = useLanguage()
  const { resolvedTheme } = useTheme()

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  const handleSettings = () => {
    setShowSettings(true)
    setIsOpen(false)
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors"
        >
          <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium">{username}</span>
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div 
            className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-2 animate__animated animate__fadeIn animate__faster" 
            style={{ 
              zIndex: 99998,
              backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
              border: `1px solid ${resolvedTheme === 'dark' ? '#475569' : '#e2e8f0'}`
            }}
          >
            <button
              onClick={handleSettings}
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
              style={{ 
                color: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = resolvedTheme === 'dark' ? '#334155' : '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Settings size={16} style={{ color: resolvedTheme === 'dark' ? '#64748b' : '#9ca3af' }} />
              {t('adminSettings')}
            </button>
            <hr style={{ 
              margin: '4px 0',
              border: 'none',
              borderTop: `1px solid ${resolvedTheme === 'dark' ? '#334155' : '#f1f5f9'}`
            }} />
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
              style={{ 
                color: resolvedTheme === 'dark' ? '#f87171' : '#dc2626',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = resolvedTheme === 'dark' ? 'rgba(127, 29, 29, 0.3)' : '#fef2f2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <LogOut size={16} style={{ color: resolvedTheme === 'dark' ? '#ef4444' : '#f87171' }} />
              {t('logout')}
            </button>
          </div>
        )}
      </div>

      {/* 管理员设置弹窗 */}
      {showSettings && (
        <AdminSettings onClose={() => setShowSettings(false)} />
      )}
    </>
  )
}