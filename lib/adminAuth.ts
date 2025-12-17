import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AdminPayload {
  adminId: string // 改为UUID字符串类型
  username: string
}

// 验证管理员token
export function verifyAdminToken(request: NextRequest): AdminPayload | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.ENCRYPTION_KEY || 'default-secret') as AdminPayload
    
    return decoded
  } catch (error) {
    return null
  }
}

// 客户端验证token是否有效
export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  
  const token = sessionStorage.getItem('adminToken')
  if (!token) return false

  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) return false
    
    // 检查token是否过期
    return decoded.exp * 1000 > Date.now()
  } catch (error) {
    return false
  }
}

// 客户端登出
export function adminLogout(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('adminToken')
  }
}