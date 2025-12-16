// 多语言翻译配置
export const translations = {
  zh: {
    // 应用标题
    appTitle: 'ShortLink',
    
    // 导航栏
    settings: '设置',
    switchLanguage: '切换语言',
    
    // 主页
    heroTitle: '让你的长链接变',
    heroTitleHighlight: '短',
    heroDesc: '简单、安全、强大的短链生成工具',
    inputPlaceholder: '在此粘贴长链接 (https://...)',
    generate: '生成',
    generating: '生成中...',
    
    // 高级选项
    advancedOptions: '高级选项',
    collapseOptions: '收起选项',
    customAddress: '自定义地址',
    customAddressPlaceholder: 'alias',
    password: '访问密码 (可选)',
    passwordPlaceholder: '留空则不设密码',
    enableIntermediate: '开启过渡页 (自动跳转)',
    enableConfirm: '强制二次确认 (手动点击)',
    
    // 短链列表
    views: '访问次数',
    copy: '复制',
    copied: '已复制',
    delete: '删除',
    confirmDelete: '确定要删除这个短链吗？',
    noLinks: '还没有创建任何短链',
    noLinksDesc: '在上方输入长链接开始使用吧',
    
    // 安全跳转页面
    leaving: '即将离开 ShortLink',
    leavingDesc: '正在前往外部链接，请确认链接安全性。',
    targetUrl: '目标链接',
    passwordProtected: '此链接受密码保护',
    enterPassword: '请输入访问密码',
    passwordError: '请输入访问密码',
    cancel: '取消访问',
    continue: '立即跳转',
    redirectingIn: '将在 {s} 秒后自动跳转...',
    verifyAndJump: '验证并跳转',
    processing: '正在跳转...',
    
    // 设置页面
    systemSettings: '系统设置',
    securityMode: '安全策略模式',
    whitelist: '白名单模式',
    blacklist: '黑名单模式',
    whitelistDesc: '仅允许访问白名单内的域名，安全性最高。',
    blacklistDesc: '拦截黑名单内的域名，其他域名正常访问。',
    redirectWait: '跳转等待时间',
    redirectWaitDesc: '自动跳转模式下的倒计时（秒）。',
    seconds: '秒',
    whitelistDomains: '白名单域名 (Whitelist)',
    blacklistDomains: '黑名单域名 (Blacklist)',
    autoCleanup: '自动清理策略',
    cleanup30: '清理 30 天未访问的短链',
    cleanupExpired: '清理已过期的短链',
    add: '添加',
    
    // 错误信息
    generateFailed: '生成失败',
    deleteFailed: '删除失败',
    copyFailed: '复制失败',
    accessFailed: '访问失败，请重试',
    networkError: '网络错误，请重试',
    
    // 页脚
    footer: '© 2024 ShortLink. 简单、安全、快速。',
    
    // 404页面
    notFound: '短链不存在',
    notFoundDesc: '抱歉，您访问的短链不存在或已被删除。请检查链接是否正确。',
    backHome: '返回首页',
    goBack: '返回上页',
    
    // 快速跳转
    loadingInfo: '正在获取链接信息...',
    accessError: '访问错误',
    back: '返回'
  },
  
  en: {
    // 应用标题
    appTitle: 'ShortLink',
    
    // 导航栏
    settings: 'Settings',
    switchLanguage: 'Switch Language',
    
    // 主页
    heroTitle: 'Shorten Your ',
    heroTitleHighlight: 'Loooong',
    heroDesc: 'Simple. Secure. Powerful Link Shortener.',
    inputPlaceholder: 'Paste your long link here (https://...)',
    generate: 'Shorten',
    generating: 'Generating...',
    
    // 高级选项
    advancedOptions: 'Advanced Options',
    collapseOptions: 'Collapse',
    customAddress: 'Custom Address',
    customAddressPlaceholder: 'alias',
    password: 'Password (Optional)',
    passwordPlaceholder: 'Leave empty for no password',
    enableIntermediate: 'Enable Transition Page (Auto)',
    enableConfirm: 'Force Secondary Confirm (Manual)',
    
    // 短链列表
    views: 'Views',
    copy: 'Copy',
    copied: 'Copied',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this link?',
    noLinks: 'No links created yet',
    noLinksDesc: 'Enter a long URL above to get started',
    
    // 安全跳转页面
    leaving: 'Leaving ShortLink',
    leavingDesc: 'Heading to an external link. Please verify the link safety.',
    targetUrl: 'Target URL',
    passwordProtected: 'Password Protected',
    enterPassword: 'Enter access password',
    passwordError: 'Please enter access password',
    cancel: 'Cancel',
    continue: 'Continue',
    redirectingIn: 'Auto redirecting in {s}s...',
    verifyAndJump: 'Verify & Jump',
    processing: 'Redirecting...',
    
    // 设置页面
    systemSettings: 'System Settings',
    securityMode: 'Security Strategy',
    whitelist: 'Whitelist Mode',
    blacklist: 'Blacklist Mode',
    whitelistDesc: 'Only allow domains in the whitelist. Highest security.',
    blacklistDesc: 'Block domains in the blacklist. Others are allowed.',
    redirectWait: 'Redirect Wait Time',
    redirectWaitDesc: 'Countdown in seconds for auto-redirect mode.',
    seconds: 's',
    whitelistDomains: 'Whitelist Domains',
    blacklistDomains: 'Blacklist Domains',
    autoCleanup: 'Auto Cleanup Policy',
    cleanup30: 'Clean up links inactive for 30 days',
    cleanupExpired: 'Clean up expired links',
    add: 'Add',
    
    // 错误信息
    generateFailed: 'Generation failed',
    deleteFailed: 'Delete failed',
    copyFailed: 'Copy failed',
    accessFailed: 'Access failed, please retry',
    networkError: 'Network error, please retry',
    
    // 页脚
    footer: '© 2024 ShortLink. Simple. Secure. Fast.',
    
    // 404页面
    notFound: 'Link Not Found',
    notFoundDesc: 'Sorry, the short link you are looking for does not exist or has been deleted. Please check if the link is correct.',
    backHome: 'Back Home',
    goBack: 'Go Back',
    
    // 快速跳转
    loadingInfo: 'Loading link information...',
    accessError: 'Access Error',
    back: 'Back'
  }
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.zh

// 翻译函数
export function useTranslation(lang: Language) {
  return (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text = translations[lang][key] || translations.zh[key] || key
    
    // 处理参数替换
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value))
      })
    }
    
    return text
  }
}