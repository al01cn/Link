import CryptoJS from 'crypto-js'

// 从环境变量获取加密密钥，如果没有则使用默认值
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'shortlink-default-key-2024'

/**
 * 加密密码
 * @param password 原始密码
 * @returns 加密后的密码
 */
export function encryptPassword(password: string): string {
  if (!password) return ''
  
  try {
    const encrypted = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString()
    return encrypted
  } catch (error) {
    console.error('密码加密失败:', error)
    return password // 如果加密失败，返回原始密码
  }
}

/**
 * 解密密码
 * @param encryptedPassword 加密后的密码
 * @returns 解密后的原始密码
 */
export function decryptPassword(encryptedPassword: string): string {
  if (!encryptedPassword) return ''
  
  try {
    // 尝试解密
    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY)
    const originalPassword = decrypted.toString(CryptoJS.enc.Utf8)
    
    // 如果解密结果为空，可能是明文密码（向后兼容）
    if (!originalPassword) {
      console.warn('解密结果为空，可能是明文密码:', encryptedPassword)
      return encryptedPassword // 返回原始值（明文密码）
    }
    
    return originalPassword
  } catch (error) {
    console.error('密码解密失败:', error)
    // 如果解密失败，可能是明文密码（向后兼容）
    return encryptedPassword
  }
}

/**
 * 验证密码是否正确
 * @param inputPassword 用户输入的密码
 * @param storedPassword 存储的加密密码
 * @returns 是否匹配
 */
export function verifyPassword(inputPassword: string, storedPassword: string): boolean {
  if (!inputPassword || !storedPassword) return false
  
  try {
    // 首先尝试直接比较（处理明文密码的情况）
    if (inputPassword === storedPassword) {
      return true
    }
    
    // 然后尝试解密后比较
    const decrypted = decryptPassword(storedPassword)
    return inputPassword === decrypted
  } catch (error) {
    console.error('密码验证失败:', error)
    return false
  }
}