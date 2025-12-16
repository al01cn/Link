import { NextRequest, NextResponse } from 'next/server'
import { isValidUrl, fetchPageTitle } from '@/lib/utils'

// 处理 /to?url= 快速跳转模式
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')

    if (!targetUrl) {
      return NextResponse.json({ error: '缺少目标URL参数' }, { status: 400 })
    }

    // 验证URL格式
    if (!isValidUrl(targetUrl)) {
      return NextResponse.json({ error: '无效的URL格式' }, { status: 400 })
    }

    // 尝试获取页面标题
    const title = await fetchPageTitle(targetUrl)

    return NextResponse.json({
      originalUrl: targetUrl,
      title: title || '外部链接',
      requireConfirm: true, // to模式默认需要确认
      enableIntermediate: true
    })

  } catch (error) {
    console.error('处理快速跳转失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}