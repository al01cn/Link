import { NextRequest, NextResponse } from 'next/server'
import { isValidUrl, fetchPageTitle } from '@/lib/utils'
import Logger, { LogType, LogLevel, LogCategory, RiskLevel } from '@/lib/logger'
import { useTranslation } from '@/lib/translations'
import { requestCache } from '@/lib/requestCache'
import { apiCache } from '@/lib/apiCache'

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
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  // 获取语言偏好（Get language preference）
  const acceptLanguage = request.headers.get('accept-language') || 'zh'
  const language = acceptLanguage.includes('en') ? 'en' : 'zh'
  const t = useTranslation(language)
  
  try {
    // 生成缓存键
    const url = new URL(request.url)
    const cacheKey = `to:${url.search}`
    
    // 尝试从缓存获取结果
    const cachedResult = await requestCache.get(
      cacheKey,
      async () => {
        return await processToRequest(request, t)
      },
      { ttl: 60000, staleWhileRevalidate: true } // 1分钟缓存，支持后台更新
    )
    
    // 添加性能头部
    const processingTime = Date.now() - startTime
    const response = NextResponse.json(cachedResult)
    response.headers.set('X-Processing-Time', `${processingTime}ms`)
    response.headers.set('X-Cache-Status', 'processed')
    
    return response
  } catch (error) {
    /**
     * 错误处理（Error handling）
     * @description 捕获并记录所有未预期的错误，返回通用错误响应（Catch and log all unexpected errors, return generic error response）
     */
    console.error(t('processQuickRedirectFailed') + ':', error)
    await Logger.logError(
      error as Error, 
      Logger.extractRequestContext(request),
      {
        endpoint: '/api/to',
        action: 'process_quick_redirect',
        processingTime: Date.now() - startTime
      }
    )
    return NextResponse.json({ error: t('apiServerError') }, { status: 500 })
  }
}

async function processToRequest(request: NextRequest, t: any): Promise<QuickRedirectResponse> {
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
    throw new Error(t('apiMissingUrlOrToken'))
  }

    // 初始化配置变量（Initialize configuration variables）
    /** 目标URL地址（Target URL address） */
    let targetUrl: string
    /** 页面标题（Page title） */
    let title: string | null = null
    /** 跳转类型（Redirect type） */
    let redirectType: RedirectType = 'auto'
    /** 显示消息（Display message） */
    let msg = t('redirectingToTarget')
    /** 是否启用人机验证（Whether to enable CAPTCHA verification） */
    let captchaEnabled = false

    // Token参数处理（优先级更高）（Token parameter processing - higher priority）
    if (tokenParam) {
      try {
        // 处理 token 的多种编码情况
        let processedToken = tokenParam;
        
        // 1. 先尝试 URL 解码
        try {
          const urlDecoded = decodeURIComponent(tokenParam);
          if (urlDecoded !== tokenParam) {
            processedToken = urlDecoded;
            console.log('检测到 URL 编码，已解码');
          }
        } catch (urlError) {
          console.log('URL 解码失败，使用原始 token');
        }
        
        // 2. 处理 URL 参数中空格被转换的问题（+ 变成空格）
        if (processedToken.includes(' ')) {
          processedToken = processedToken.replace(/ /g, '+');
          console.log('修复了空格转换问题');
        }

        /**
         * 解码Base64 Token并解析JSON配置（Decode Base64 Token and parse JSON configuration）
         * @description 将Base64编码的Token解码为UTF-8字符串，然后解析为JSON对象（Decode Base64 encoded Token to UTF-8 string, then parse as JSON object）
         */
        const decodedToken = Buffer.from(processedToken, 'base64').toString('utf-8')
        
        // 检查解码后的字符串是否完整
        if (!decodedToken.trim().endsWith('}')) {
          throw new Error('Token 解码后的 JSON 字符串不完整，可能被截断');
        }
        
        /** Token配置对象（Token configuration object） */
        const tokenConfig: TokenConfig = JSON.parse(decodedToken)

        // Token配置验证（Token configuration validation）
        if (!tokenConfig.url) {
          throw new Error(t('tokenMissingUrlField'))
        }

        // 应用Token配置（Apply Token configuration）
        targetUrl = tokenConfig.url
        title = tokenConfig.title || null
        msg = tokenConfig.msg || t('redirectingToTarget')
        captchaEnabled = tokenConfig.turnstile || false

        // 处理跳转类型（Handle redirect type）
        redirectType = tokenConfig.type || 'auto'

      } catch (error: unknown) {
        // 提供更详细的错误信息以便调试
        let errorMessage = t('invalidTokenFormat');
        const debugInfo: any = {};
        
        if (error instanceof SyntaxError) {
          errorMessage = t('tokenNotValidJson');
          debugInfo.type = 'JSON_PARSE_ERROR';
          debugInfo.message = error.message;
        } else if (error instanceof Error) {
          if (error.message?.includes('Invalid character')) {
            errorMessage = t('tokenNotValidBase64');
            debugInfo.type = 'BASE64_DECODE_ERROR';
          }
          debugInfo.message = error.message;
        }
        
        // 添加 token 调试信息
        try {
          const decodedToken = Buffer.from(tokenParam, 'base64').toString('utf-8');
          debugInfo.decodedLength = decodedToken.length;
          debugInfo.decodedPreview = decodedToken.substring(0, 100);
        } catch (decodeError) {
          debugInfo.decodeError = 'Base64解码失败';
        }
        
        console.error('Token解析失败:', {
          token: tokenParam,
          tokenLength: tokenParam.length,
          error: error instanceof Error ? error.message : String(error),
          debugInfo
        });
        
        throw new Error(errorMessage)
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
    throw new Error(t('invalidUrlFormat'))
  }

  /**
   * 页面标题获取（Page title fetching）
   * @description 如果Token中没有提供title，尝试自动获取目标页面的标题（If title is not provided in Token, try to automatically fetch target page title）
   */
  if (!title) {
    // 使用缓存获取页面标题，避免重复请求
    title = await requestCache.get(
      `title:${targetUrl}`,
      () => fetchPageTitle(targetUrl),
      { ttl: 300000 } // 5分钟缓存
    )
  }

  /**
   * 记录TO跳转准备日志（Record TO redirect preparation log）
   * @description 记录通过TO路径准备跳转的请求，实际访问统计将在真正跳转时记录（Record TO path redirect preparation request, actual visit statistics will be recorded when actually redirecting）
   */
  await Logger.log({
    type: LogType.SYSTEM,
    level: LogLevel.INFO,
    category: LogCategory.ACCESS,
    messageKey: 'toPrepareRedirect',
    messageParams: { targetUrl },
    action: 'prepare_redirect',
    resource: `to:${targetUrl}`,
    details: {
      targetUrl,
      title: title || t('externalLink'),
      type: redirectType,
      msg,
      captchaEnabled,
      source: tokenParam ? 'token' : 'url'
    },
    riskLevel: RiskLevel.LOW,
    tags: ['to', 'redirect', 'prepare']
  }, Logger.extractRequestContext(request))

  /**
   * 构建响应数据（Build response data）
   * @description 返回包含所有跳转配置的JSON响应（Return JSON response containing all redirect configurations）
   */
  const response: QuickRedirectResponse = {
    originalUrl: targetUrl,
    title: title || t('externalLink'),
    type: redirectType,
    enableIntermediate: true,
    msg,
    captchaEnabled
  }

  return response
}