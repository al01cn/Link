import { NextRequest, NextResponse } from 'next/server'
import { isValidUrl, fetchPageTitle } from '@/lib/utils'
import { logActivity, logError } from '@/lib/logger'

/**
 * 跳转类型枚举（Redirect type enumeration）
 * @description 定义支持的跳转模式类型（Defines supported redirect mode types）
 */
type RedirectType = 'href' | 'auto' | 'confirm'

/**
 * Token配置接口定义（Token configuration interface definition）
 * @interface TokenConfig
 * @description 定义Token参数中支持的配置选项（Defines configuration options supported in Token parameter）
 */
interface TokenConfig {
  /** 目标URL地址（Target URL address） */
  url: string
  /** 页面标题（Page title） */
  title?: string
  /** 跳转类型：href=直接跳转，auto=自动跳转，confirm=二次确认（Redirect type: href=direct redirect, auto=auto redirect, confirm=confirmation required） */
  type?: RedirectType
  /** 自定义消息（Custom message） */
  msg?: string
  /** 是否启用人机验证（Whether to enable CAPTCHA verification） */
  turnstile?: boolean
}

/**
 * 快速跳转响应接口定义（Quick redirect response interface definition）
 * @interface QuickRedirectResponse
 * @description 定义快速跳转API的响应数据结构（Defines response data structure for quick redirect API）
 */
interface QuickRedirectResponse {
  /** 原始URL地址（Original URL address） */
  originalUrl: string
  /** 页面标题（Page title） */
  title: string
  /** 跳转类型（Redirect type） */
  type: RedirectType
  /** 是否启用中间页（Whether enable intermediate page） */
  enableIntermediate: boolean
  /** 显示消息（Display message） */
  msg: string
  /** 是否启用人机验证（Whether to enable CAPTCHA verification） */
  captchaEnabled: boolean
}

/**
 * 处理快速跳转请求（Handle quick redirect requests）
 * @description 处理 /to 路径的快速跳转模式，支持URL参数和Token高级传参两种方式。Token参数优先级高于URL参数，支持更丰富的配置选项。
 * 支持三种跳转模式：href（直接跳转）、auto（自动跳转）、confirm（二次确认）。
 * (Handles quick redirect mode for /to path, supports both URL parameters and Token advanced parameter passing. Token parameter has higher priority than URL parameter and supports richer configuration options.
 * Supports three redirect modes: href (direct redirect), auto (auto redirect), confirm (confirmation required).)
 * 
 * @param {NextRequest} request - Next.js请求对象，包含查询参数（Next.js request object containing query parameters）
 * @returns {Promise<NextResponse>} 返回包含跳转配置的JSON响应或错误信息（Returns JSON response containing redirect configuration or error message）
 * 
 * @throws {400} 当缺少必需参数、参数格式无效或Token解析失败时（When missing required parameters, invalid parameter format, or Token parsing fails）
 * @throws {500} 当服务器内部错误时（When server internal error occurs）
 * 
 * @example
 * ```typescript
 * // URL参数模式（URL parameter mode）
 * GET /to?url=https://example.com&type=auto
 * 
 * // Token参数模式（Token parameter mode）
 * GET /to?token=eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIiwidHlwZSI6ImNvbmZpcm0ifQ==
 * 
 * // 混合模式（Token优先）（Mixed mode - Token priority）
 * GET /to?url=https://backup.com&token=eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIn0=
 * ```
 * 
 * @see {@link TokenConfig} Token配置接口（Token configuration interface）
 * @see {@link QuickRedirectResponse} 响应数据接口（Response data interface）
 */
export async function GET(request: NextRequest): Promise<NextResponse<QuickRedirectResponse | { error: string }>> {
  try {
    // 解析查询参数（Parse query parameters）
    const { searchParams } = new URL(request.url)
    /** URL参数：目标链接地址（URL parameter: target link address） */
    const urlParam = searchParams.get('url')
    /** Token参数：Base64编码的JSON配置（Token parameter: Base64 encoded JSON configuration） */
    const tokenParam = searchParams.get('token')
    /** Type参数：跳转类型控制（Type parameter: redirect type control） */
    const typeParam = searchParams.get('type')

    // 参数验证：url和token必须提供其中一个（Parameter validation: either url or token must be provided）
    if (!urlParam && !tokenParam) {
      return NextResponse.json({ error: '必须提供url或token参数其中一个' }, { status: 400 })
    }

    // 初始化配置变量（Initialize configuration variables）
    /** 目标URL地址（Target URL address） */
    let targetUrl: string
    /** 页面标题（Page title） */
    let title: string | null = null
    /** 跳转类型（Redirect type） */
    let redirectType: RedirectType = 'auto'
    /** 显示消息（Display message） */
    let msg = '正在前往目标链接...'
    /** 是否启用人机验证（Whether to enable CAPTCHA verification） */
    let captchaEnabled = false

    // Token参数处理（优先级更高）（Token parameter processing - higher priority）
    if (tokenParam) {
      try {
        /**
         * 解码Base64 Token并解析JSON配置（Decode Base64 Token and parse JSON configuration）
         * @description 将Base64编码的Token解码为UTF-8字符串，然后解析为JSON对象（Decode Base64 encoded Token to UTF-8 string, then parse as JSON object）
         */
        const decodedToken = Buffer.from(tokenParam, 'base64').toString('utf-8')
        /** Token配置对象（Token configuration object） */
        const tokenConfig: TokenConfig = JSON.parse(decodedToken)

        // Token配置验证（Token configuration validation）
        if (!tokenConfig.url) {
          return NextResponse.json({ error: 'Token中缺少url字段' }, { status: 400 })
        }

        // 应用Token配置（Apply Token configuration）
        targetUrl = tokenConfig.url
        title = tokenConfig.title || null
        msg = tokenConfig.msg || '正在前往目标链接...'
        captchaEnabled = tokenConfig.turnstile || false

        // 处理跳转类型（Handle redirect type）
        redirectType = tokenConfig.type || 'auto'

      } catch (error) {
        return NextResponse.json({ error: '无效的Token格式' }, { status: 400 })
      }
    } else {
      /**
       * URL参数模式处理（URL parameter mode processing）
       * @description 当没有Token参数时，使用URL参数模式进行配置（When no Token parameter, use URL parameter mode for configuration）
       */
      targetUrl = urlParam!
      
      // 处理type参数（Process type parameter）
      if (typeParam) {
        const validTypes: RedirectType[] = ['href', 'auto', 'confirm']
        if (validTypes.includes(typeParam as RedirectType)) {
          redirectType = typeParam as RedirectType
        }
      }
    }

    /**
     * URL格式验证（URL format validation）
     * @description 使用工具函数验证目标URL的格式是否正确（Use utility function to validate target URL format）
     */
    if (!isValidUrl(targetUrl)) {
      return NextResponse.json({ error: '无效的URL格式' }, { status: 400 })
    }

    /**
     * 页面标题获取（Page title fetching）
     * @description 如果Token中没有提供title，尝试自动获取目标页面的标题（If title is not provided in Token, try to automatically fetch target page title）
     */
    if (!title) {
      title = await fetchPageTitle(targetUrl)
    }

    /**
     * 记录TO跳转日志（Record TO redirect log）
     * @description 记录通过TO路径进行的跳转访问（Record redirect access through TO path）
     */
    await logActivity({
      type: 'visit',
      message: `TO跳转访问: ${targetUrl}`,
      details: {
        targetUrl,
        title: title || '外部链接',
        type: redirectType,
        msg,
        captchaEnabled,
        source: tokenParam ? 'token' : 'url'
      },
      request
    })

    /**
     * 构建响应数据（Build response data）
     * @description 返回包含所有跳转配置的JSON响应（Return JSON response containing all redirect configurations）
     */
    const response: QuickRedirectResponse = {
      originalUrl: targetUrl,
      title: title || '外部链接',
      type: redirectType,
      enableIntermediate: true,
      msg,
      captchaEnabled
    }

    return NextResponse.json(response)

  } catch (error) {
    /**
     * 错误处理（Error handling）
     * @description 捕获并记录所有未预期的错误，返回通用错误响应（Catch and log all unexpected errors, return generic error response）
     */
    console.error('处理快速跳转失败:', error)
    await logError('处理快速跳转失败', error, request)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}