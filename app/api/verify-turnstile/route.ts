import { NextRequest, NextResponse } from 'next/server'
import { useTranslation } from '@/lib/translations'

// Turnstile 验证接口
export async function POST(request: NextRequest) {
  // 获取语言偏好
  const acceptLanguage = request.headers.get('accept-language') || 'zh'
  const language = acceptLanguage.includes('en') ? 'en' : 'zh'
  const t = useTranslation(language)
  
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: t('missingVerificationToken') 
      }, { status: 400 })
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ 
        success: false, 
        error: t('turnstileConfigError') 
      }, { status: 500 })
    }

    // 开发环境使用测试密钥时，直接返回成功
    if (secretKey === '1x0000000000000000000000000000000AA') {
      console.log(t('devTurnstileVerifyPass'));
      return NextResponse.json({ 
        success: true,
        message: t('devVerificationSuccess') 
      })
    }

    // 生产环境向 Cloudflare 验证令牌
    try {
      const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
          remoteip: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1'
        }),
        // 添加超时设置
        signal: AbortSignal.timeout(5000) // 5秒超时
      })

      const verifyResult = await verifyResponse.json()

      if (verifyResult.success) {
        return NextResponse.json({ 
          success: true,
          message: t('verificationSuccess') 
        })
      } else {
        return NextResponse.json({ 
          success: false, 
          error: t('captchaFailed'),
          details: verifyResult['error-codes'] || []
        }, { status: 400 })
      }
    } catch (fetchError) {
      console.error(t('cloudflareVerifyRequestFailed') + ':', fetchError);
      // 网络错误时，在开发环境可以选择跳过验证
      if (process.env.NODE_ENV === 'development') {
        console.log(t('devNetworkErrorSkipVerify'));
        return NextResponse.json({ 
          success: true,
          message: t('devSkipVerification') 
        })
      }
      throw fetchError; // 生产环境仍然抛出错误
    }

  } catch (error) {
    console.error(t('turnstileVerificationError') + ':', error)
    return NextResponse.json({ 
      success: false, 
      error: t('turnstileVerificationError') 
    }, { status: 500 })
  }
}