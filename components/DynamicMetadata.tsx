'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { updateClientMetadata } from '@/lib/metadata'

/**
 * 动态元数据组件
 * 根据当前语言动态更新页面的 title、description 和其他 SEO 元数据
 */
export default function DynamicMetadata() {
  const { language } = useLanguage()

  useEffect(() => {
    // 使用统一的元数据更新函数
    updateClientMetadata(language)
  }, [language])

  return null // 这个组件不渲染任何内容
}