'use client'

import { Sun, Moon, Monitor, Clock } from 'lucide-react'
import { useTheme, type ThemeMode } from '@/lib/ThemeContext'
import { TranslationKey } from '@/lib/translations'

interface ThemeToggleProps {
  t: (key: any) => string
}

export default function ThemeToggle({ t }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const themes: { mode: ThemeMode; icon: React.ReactNode; title: string }[] = [
    { mode: 'light', icon: <Sun size={18} />, title: t('lightMode') },
    { mode: 'dark', icon: <Moon size={18} />, title: t('darkMode') },
    { mode: 'system', icon: <Monitor size={18} />, title: t('systemMode') },
    { mode: 'time', icon: <Clock size={18} />, title: t('timeMode') },
  ]

  // 获取当前主题的图标和标题
  const currentTheme = themes.find(t => t.mode === theme) || themes[0]

  // 循环切换到下一个主题
  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.mode === theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex].mode)
  }

  return (
    <>
      {/* 小屏幕：单个切换按钮 */}
      <button
        onClick={cycleTheme}
        className="sm:hidden cute-btn w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        title={currentTheme.title}
      >
        {currentTheme.icon}
      </button>

      {/* 大屏幕：完整按钮组 */}
      <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 transition-colors">
        {themes.map(({ mode, icon, title }) => (
          <button
            key={mode}
            onClick={() => setTheme(mode)}
            className={`
              cute-btn w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
              ${theme === mode 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }
            `}
            title={title}
          >
            {icon}
          </button>
        ))}
      </div>
    </>
  )
}