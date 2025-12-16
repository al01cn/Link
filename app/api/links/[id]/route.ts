import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { decryptPassword } from '@/lib/crypto'
import { verifyAdminToken } from '@/lib/adminAuth'

// 获取单个短链信息（包括密码）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 })
    }

    // 检查管理员权限
    const adminPayload = verifyAdminToken(request)
    if (!adminPayload) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 401 })
    }

    const link = await prisma.shortLink.findUnique({
      where: { id }
    })

    if (!link) {
      return NextResponse.json({ error: '短链不存在' }, { status: 404 })
    }

    // 解密密码（如果有的话）
    const decryptedPassword = link.password ? decryptPassword(link.password) : null

    return NextResponse.json({
      id: link.id,
      password: decryptedPassword,
      hasPassword: !!link.password
    })
  } catch (error) {
    console.error('获取短链信息失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 删除短链
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    
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