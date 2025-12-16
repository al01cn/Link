import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// 管理员登录
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    // 查找管理员账户
    let admin = await prisma.admin.findUnique({
      where: { username }
    })

    // 如果没有找到管理员账户，检查是否为默认账户
    if (!admin && username === 'Loooong' && password === 'Loooong123') {
      // 创建默认管理员账户
      const hashedPassword = await bcrypt.hash(password, 10)
      admin = await prisma.admin.create({
        data: {
          username,
          password: hashedPassword,
          isDefault: true
        }
      })
    }

    if (!admin) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 生成JWT token
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username },
      process.env.ENCRYPTION_KEY || 'default-secret',
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      success: true,
      token,
      isDefault: admin.isDefault,
      username: admin.username
    })

  } catch (error) {
    console.error('管理员登录错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}