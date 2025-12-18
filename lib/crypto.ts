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
 * 检测字符串是否为加密格式
 * @param str 待检测的字符串
 * @returns 是否为加密格式
 */
export function isEncryptedFormat(str: string): boolean {
  if (!str) return false
  
  try {
    // AES 加密后的字符串通常包含特定的字符和长度特征
    // 这里使用简单的启发式检测
    return str.length > 20 && /^[A-Za-z0-9+/=]+$/.test(str)
  } catch {
    return false
  }
}

/**
 * 验证密码是否正确（支持不同验证模式）
 * @param inputPassword 用户输入的密码
 * @param storedPassword 存储的加密密码
 * @param isAutoFill 是否为自动填充（pwd参数），默认false表示手动输入
 * @returns 是否匹配
 */
export function verifyPassword(inputPassword: string, storedPassword: string, isAutoFill: boolean = false): boolean {
  if (!inputPassword || !storedPassword) return false
  
  try {
    if (isAutoFill) {
      // pwd 参数模式：支持明文密码和加密字符串两种格式
      
      // 方式1：直接比较加密字符串（用于传递加密密码的情况）
      if (inputPassword === storedPassword) {
        return true
      }
      
      // 方式2：解密存储密码后与输入密码比较（用于传递明文密码的情况）
      const decryptedStored = decryptPassword(storedPassword)
      if (inputPassword === decryptedStored) {
        return true
      }
      
      return false
    } else {
      // 手动输入模式：只支持明文密码验证
      
      // 解密存储密码后与输入的明文密码比较
      const decryptedStored = decryptPassword(storedPassword)
      if (inputPassword === decryptedStored) {
        return true
      }
      
      return false
    }
  } catch (error) {
    console.error('密码验证失败:', error)
    return false
  }
}