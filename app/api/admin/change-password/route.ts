import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { translateForRequest } from '@/lib/translations'

// 修改管理员密码
export async function POST(request: NextRequest) {
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

    const { currentPassword, newUsername, newPassword } = await request.json()

    if (!currentPassword || !newUsername || !newPassword) {
      return NextResponse.json({ error: translateForRequest(request, 'pleaseEnterAllFields') }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: translateForRequest(request, 'newPasswordMinLength') }, { status: 400 })
    }

    // 查找当前管理员
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId }
    })

    if (!admin) {
      return NextResponse.json({ error: translateForRequest(request, 'apiAdminNotFound') }, { status: 404 })
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: translateForRequest(request, 'apiUnauthorizedOrWrongPassword') }, { status: 401 })
    }

    // 检查新用户名是否已存在（排除当前用户）
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        username: newUsername,
        id: { not: admin.id }
      }
    })

    if (existingAdmin) {
      return NextResponse.json({ error: translateForRequest(request, 'apiParamErrorOrUserExists') }, { status: 400 })
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // 更新管理员信息
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        username: newUsername,
        password: hashedNewPassword,
        isDefault: false // 修改后不再是默认账户
      }
    })

    return NextResponse.json({
      success: true,
      message: translateForRequest(request, 'apiAdminInfoModified')
    })

  } catch (error) {
    console.error('修改管理员密码错误:', error)
    return NextResponse.json({ error: translateForRequest(request, 'serverError') }, { status: 500 })
  }
}