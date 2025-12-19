'use client'

import { Link2, Settings, Globe, Book, Activity } from 'lucide-react'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import AdminDropdown from './AdminDropdown'
import ApiDocumentation from './ApiDocumentation'
import EnhancedLogsView from './EnhancedLogsView'
import ThemeToggle from './ThemeToggle'
import { TranslationKey } from '@/lib/translations'

interface NavbarProps {
  onViewChange: (view: string) => void
  currentView: string
  lang: string
  toggleLang: () => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

export default function Navbar({ onViewChange, currentView, lang, toggleLang, t }: NavbarProps) {
  const [showApiDocs, setShowApiDocs] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  return (
    <>
      <ApiDocumentation isOpen={showApiDocs} onClose={() => setShowApiDocs(false)} />
      <EnhancedLogsView isOpen={showLogs} onClose={() => setShowLogs(false)} />
      <nav className="flex items-center sm:justify-between justify-center px-4 sm:px-6 py-3 sm:py-4 max-w-5xl mx-auto w-full z-10 relative">
        {/* Logo区域 - 只在小屏幕及以上显示 */}
        <div
          className="hidden sm:flex items-center gap-2 cursor-pointer"
          onClick={() => onViewChange('home')}
        >
          <div className="w-8 h-8 bg-(--color-primary) rounded-lg flex items-center justify-center text-white font-bold shine-effect shadow-lg">
            <Link2 size={20} />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-800 dark:text-slate-200">{t('appTitle')}</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          {/* 主题切换按钮组 */}
          <ThemeToggle t={(key: string) => t(key as any)} />

          {/* 语言切换按钮 */}
          <button
            onClick={toggleLang}
            className="cute-btn w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors relative"
            title={t('switchLanguage')}
          >
            <Globe size={18} />
            <span className="sr-only">{t('switchLanguage')}</span>
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-600 dark:text-slate-300">
              {lang.toUpperCase()}
            </span>
          </button>

          {/* API文档按钮 - 响应式：大屏显示文字，小屏只显示图标 */}
          <button
            onClick={() => setShowApiDocs(true)}
            className="cute-btn sm:px-4 sm:py-2 w-10 h-10 sm:w-auto sm:h-auto rounded-full text-sm font-medium transition-colors flex items-center justify-center sm:gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            title={t('apiDocumentation')}
          >
            <Book size={18} />
            <span className="hidden sm:inline">API</span>
          </button>

          {/* 系统日志按钮 - 响应式：大屏显示文字，小屏只显示图标 */}
          <button
            onClick={() => setShowLogs(true)}
            className="cute-btn sm:px-4 sm:py-2 w-10 h-10 sm:w-auto sm:h-auto rounded-full text-sm font-medium transition-colors flex items-center justify-center sm:gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            title={t('systemLogs')}
          >
            <Activity size={18} />
            <span className="hidden sm:inline">{t('logs')}</span>
          </button>

          {/* 设置按钮 - 响应式：大屏显示文字，小屏只显示图标 */}
          <button
            onClick={() => onViewChange('settings')}
            className={`cute-btn sm:px-4 sm:py-2 w-10 h-10 sm:w-auto sm:h-auto rounded-full text-sm font-medium transition-colors flex items-center justify-center sm:gap-2 ${currentView === 'settings' 
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' 
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            title={t('settings')}
          >
            <Settings size={18} />
            <span className="hidden sm:inline">{t('settings')}</span>
          </button>

          <AdminDropdown />

          {/* 分割线 - 只在中等屏幕及以上显示 */}
          <div className="hidden md:block w-px h-6 bg-slate-300 dark:bg-slate-600 self-center"></div>

          {/* GitHub链接 - 只在中等屏幕及以上显示 */}
          <a
            href="https://github.com/al01cn/Link"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex cute-btn w-10 h-10 rounded-full items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title={`${t('sourceCode')} - GitHub`}
          >
            <Icon icon="mdi:github" width={24} />
          </a>

          {/* Gitee链接 - 只在中等屏幕及以上显示 */}
          <a
            href="https://gitee.com/al01/Link"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex cute-btn w-10 h-10 rounded-full items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title={`${t('sourceCode')} - Gitee`}
          >
            <Icon icon="simple-icons:gitee" width={20} />
          </a>

          {/* Gitcode链接 - 只在中等屏幕及以上显示 */}
          <a
            href="https://gitcode.com/al01cn/Link"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex cute-btn w-10 h-10 rounded-full items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title={`${t('sourceCode')} - Gitee`}
          >
            <Icon icon="simple-icons:gitcode" width={20} />
          </a>
        </div>
      </nav>
    </>
  )
}