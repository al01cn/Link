import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 删除短链
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 })
    }

    await prisma.shortLink.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除短链失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}