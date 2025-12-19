import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { translateForRequest } from '@/lib/translations'

// 检查管理员是否使用默认密码
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: translateForRequest(request, 'apiUnauthorized') }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.ENCRYPTION_KEY || 'default-secret')
    } catch (error) {
      return NextResponse.json({ error: translateForRequest(request, 'apiUnauthorized') }, { status: 401 })
    }

    // 查找当前管理员
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId }
    })

    if (!admin) {
      return NextResponse.json({ error: translateForRequest(request, 'apiAdminNotFound') }, { status: 404 })
    }

    // 检查是否使用默认密码
    const isUsingDefaultPassword = await bcrypt.compare('Loooong123', admin.password)

    return NextResponse.json({
      success: true,
      isDefault: isUsingDefaultPassword,
      username: admin.username
    })

  } catch (error) {
    console.error('检查默认密码错误:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}