'use client'

import { useEffect, useRef } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { Shield, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  className?: string
}

export default function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = ''
}: TurnstileWidgetProps) {
  const { t } = useLanguage()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  if (!siteKey) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 text-center ${className}`}>
        <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 text-sm font-medium">{t('captchaConfigError')}</p>
        <p className="text-red-500 text-xs mt-1">{t('checkTurnstileConfig')}</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-2 mb-3 text-slate-600">
        <Shield size={16} />
        <span className="text-sm font-medium">{t('securityVerification')}</span>
      </div>
      
      <Turnstile
        siteKey={siteKey}
        onSuccess={onVerify}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme,
          size,
          language: 'zh-CN'
        }}
      />
    </div>
  )
}