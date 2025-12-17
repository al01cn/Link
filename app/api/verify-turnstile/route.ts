import { NextRequest, NextResponse } from 'next/server'

// Turnstile 验证接口
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少验证令牌' 
      }, { status: 400 })
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Turnstile 配置错误' 
      }, { status: 500 })
    }

    // 向 Cloudflare 验证令牌
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
      })
    })

    const verifyResult = await verifyResponse.json()

    if (verifyResult.success) {
      return NextResponse.json({ 
        success: true,
        message: '验证成功' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: '人机验证失败',
        details: verifyResult['error-codes'] || []
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Turnstile 验证错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '验证服务异常' 
    }, { status: 500 })
  }
}