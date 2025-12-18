import { Metadata } from 'next'
import { Language, translations } from './translations'

/**
 * 根据语言生成页面元数据
 * @param language 语言代码
 * @returns Metadata 对象
 */
export function generateMetadata(language: Language): Metadata {
  const t = (key: keyof typeof translations.zh) => {
    return translations[language][key] || translations.zh[key] || key
  }

  const title = `${t('appTitle')} - ${t('heroDesc')}`
  const description = t('heroDesc')
  
  return {
    title,
    description,
    keywords: language === 'zh' 
      ? '短链接,URL缩短,链接生成器,短网址,灵狼Link'
      : 'short link,URL shortener,link generator,short URL,AL01 Link',
    
    // Open Graph 标签
    openGraph: {
      title,
      description,
      type: 'website',
      locale: language === 'zh' ? 'zh_CN' : 'en_US',
    },
    
    // Twitter Card 标签
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    
    // 其他 meta 标签
    other: {
      'theme-color': '#3b82f6',
      'color-scheme': 'light dark',
    }
  }
}

/**
 * 默认元数据（中文）
 */
export const defaultMetadata = generateMetadata('zh')

/**
 * 客户端动态更新元数据的工具函数
 * @param language 语言代码
 */
export function updateClientMetadata(language: Language) {
  const t = (key: keyof typeof translations.zh) => {
    return translations[language][key] || translations.zh[key] || key
  }

  const title = `${t('appTitle')} - ${t('heroDesc')}`
  const description = t('heroDesc')
  
  // 更新页面标题
  document.title = title

  // 辅助函数：更新或创建 meta 标签
  const updateOrCreateMeta = (selector: string, attributes: Record<string, string>) => {
    let meta = document.querySelector(selector)
    if (meta) {
      Object.entries(attributes).forEach(([key, value]) => {
        meta!.setAttribute(key, value)
      })
    } else {
      meta = document.createElement('meta')
      Object.entries(attributes).forEach(([key, value]) => {
        meta!.setAttribute(key, value)
      })
      document.head.appendChild(meta)
    }
  }

  // 更新基础 meta 标签
  updateOrCreateMeta('meta[name="description"]', {
    name: 'description',
    content: description
  })

  updateOrCreateMeta('meta[name="keywords"]', {
    name: 'keywords',
    content: language === 'zh' 
      ? '短链接,URL缩短,链接生成器,短网址,灵狼Link'
      : 'short link,URL shortener,link generator,short URL,AL01 Link'
  })

  // 更新 Open Graph 标签
  updateOrCreateMeta('meta[property="og:title"]', {
    property: 'og:title',
    content: title
  })

  updateOrCreateMeta('meta[property="og:description"]', {
    property: 'og:description',
    content: description
  })

  updateOrCreateMeta('meta[property="og:type"]', {
    property: 'og:type',
    content: 'website'
  })

  updateOrCreateMeta('meta[property="og:locale"]', {
    property: 'og:locale',
    content: language === 'zh' ? 'zh_CN' : 'en_US'
  })

  // 更新 Twitter Card 标签
  updateOrCreateMeta('meta[name="twitter:card"]', {
    name: 'twitter:card',
    content: 'summary_large_image'
  })

  updateOrCreateMeta('meta[name="twitter:title"]', {
    name: 'twitter:title',
    content: title
  })

  updateOrCreateMeta('meta[name="twitter:description"]', {
    name: 'twitter:description',
    content: description
  })

  // 更新 html lang 属性
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'

  // 更新 dir 属性（文本方向）
  document.documentElement.dir = 'ltr'
}