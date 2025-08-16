import crypto from 'crypto'

export class TwoFactorAuthService {
  constructor() {
    // Pending 2FA işlemleri için memory store
    this.pending2FA = new Map() // email -> { code, expiry, action, userData }
    this.activeCodes = new Set() // Aktif kodlar (collision prevention)
    
    // 5 dakika timeout için cleanup
    setInterval(() => {
      this.cleanupExpiredCodes()
    }, 30000) // 30 saniyede bir kontrol et
  }

  generateCode() {
    let code
    let attempts = 0
    
    // Unique kod garantisi
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString()
      attempts++
    } while (this.activeCodes.has(code) && attempts < 10)
    
    if (attempts >= 10) {
      throw new Error('2FA kod oluşturulamadı, tekrar deneyin')
    }
    
    this.activeCodes.add(code)
    return code
  }

  async storePending2FA(email, action = 'login', userData = null) {
    const code = this.generateCode()
    const expiry = Date.now() + (5 * 60 * 1000) // 5 dakika
    
    // Önceki pending işlemi varsa temizle
    const existing = this.pending2FA.get(email)
    if (existing && existing.code) {
      this.activeCodes.delete(existing.code)
    }
    
    this.pending2FA.set(email, {
      code,
      expiry,
      action,
      userData,
      createdAt: Date.now()
    })
    
    console.log(`📱 2FA kodu oluşturuldu: ${email} - Action: ${action} - Code: ${code}`)
    return code
  }

  async verifyCode(email, inputCode, expectedAction = 'login') {
    const pending = this.pending2FA.get(email)
    
    if (!pending) {
      throw new Error('2FA kodu bulunamadı veya süresi dolmuş')
    }
    
    if (Date.now() > pending.expiry) {
      this.pending2FA.delete(email)
      this.activeCodes.delete(pending.code)
      throw new Error('2FA kodu süresi dolmuş')
    }
    
    if (pending.code !== inputCode) {
      throw new Error('Geçersiz 2FA kodu')
    }
    
    if (pending.action !== expectedAction) {
      throw new Error(`Geçersiz 2FA işlem türü. Beklenen: ${expectedAction}, Gelen: ${pending.action}`)
    }
    
    // Başarılı doğrulama sonrası temizlik
    this.pending2FA.delete(email)
    this.activeCodes.delete(pending.code)
    
    console.log(`✅ 2FA doğrulandı: ${email} - Action: ${expectedAction}`)
    return pending.userData
  }

  cleanupExpiredCodes() {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [email, pending] of this.pending2FA.entries()) {
      if (now > pending.expiry) {
        this.pending2FA.delete(email)
        this.activeCodes.delete(pending.code)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Expired 2FA kodları temizlendi: ${cleanedCount} adet`)
    }
  }

  getPendingInfo(email) {
    const pending = this.pending2FA.get(email)
    if (!pending) return null
    
    return {
      hasCode: true,
      action: pending.action,
      expiresIn: Math.max(0, pending.expiry - Date.now()),
      createdAt: pending.createdAt
    }
  }

  getStats() {
    return {
      pendingCodes: this.pending2FA.size,
      activeCodes: this.activeCodes.size,
      timestamp: new Date().toISOString()
    }
  }
}

export class RefreshTokenService {
  constructor() {
    this.refreshTokens = new Map() // token -> { userId, email, ip, userAgent, expiry, isActive }
    this.userSessions = new Map() // userId -> Set of tokens
    
    // Token cleanup her 30 dakikada bir
    setInterval(() => {
      this.cleanupExpiredTokens()
    }, 30 * 60 * 1000)
  }

  generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex')
  }

  async createRefreshToken(userId, email, ip, userAgent, rememberMe = false) {
    const token = this.generateRefreshToken()
    const expiry = Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000) // 30 gün : 6 saat
    
    const tokenData = {
      userId,
      email,
      ip,
      userAgent,
      expiry,
      isActive: true,
      createdAt: Date.now()
    }
    
    this.refreshTokens.set(token, tokenData)
    
    // User session tracking
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set())
    }
    this.userSessions.get(userId).add(token)
    
    console.log(`🔄 Refresh token oluşturuldu: ${email} - ${rememberMe ? '30 gün' : '6 saat'}`)
    return { token, expiry }
  }

  async validateRefreshToken(token, ip, userAgent) {
    const tokenData = this.refreshTokens.get(token)
    
    if (!tokenData) {
      throw new Error('Geçersiz refresh token')
    }
    
    if (!tokenData.isActive) {
      throw new Error('Deaktif refresh token')
    }
    
    if (Date.now() > tokenData.expiry) {
      this.refreshTokens.delete(token)
      throw new Error('Refresh token süresi dolmuş')
    }
    
    // IP ve User-Agent kontrolü (güvenlik)
    if (tokenData.ip !== ip || tokenData.userAgent !== userAgent) {
      console.warn(`⚠️ Refresh token güvenlik uyarısı: ${tokenData.email} - IP/UA mismatch`)
      // Opsiyonel: strict mode'da token'ı geçersiz kıl
      // throw new Error('Session güvenlik kontrolü başarısız')
    }
    
    return tokenData
  }

  async deactivateToken(token) {
    const tokenData = this.refreshTokens.get(token)
    if (tokenData) {
      tokenData.isActive = false
      console.log(`🚫 Refresh token deaktif edildi: ${tokenData.email}`)
    }
  }

  async deactivateAllUserTokens(userId) {
    const userTokens = this.userSessions.get(userId)
    if (!userTokens) return 0
    
    let deactivatedCount = 0
    for (const token of userTokens) {
      const tokenData = this.refreshTokens.get(token)
      if (tokenData && tokenData.isActive) {
        tokenData.isActive = false
        deactivatedCount++
      }
    }
    
    console.log(`🚫 Kullanıcının tüm refresh token'ları deaktif edildi: ${userId} - ${deactivatedCount} adet`)
    return deactivatedCount
  }

  cleanupExpiredTokens() {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [token, tokenData] of this.refreshTokens.entries()) {
      if (now > tokenData.expiry || !tokenData.isActive) {
        this.refreshTokens.delete(token)
        
        // User session'dan da sil
        const userTokens = this.userSessions.get(tokenData.userId)
        if (userTokens) {
          userTokens.delete(token)
          if (userTokens.size === 0) {
            this.userSessions.delete(tokenData.userId)
          }
        }
        
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Expired refresh token'lar temizlendi: ${cleanedCount} adet`)
    }
  }

  getUserActiveSessions(userId) {
    const userTokens = this.userSessions.get(userId)
    if (!userTokens) return []
    
    const sessions = []
    for (const token of userTokens) {
      const tokenData = this.refreshTokens.get(token)
      if (tokenData && tokenData.isActive && Date.now() <= tokenData.expiry) {
        sessions.push({
          ip: tokenData.ip,
          userAgent: tokenData.userAgent,
          createdAt: tokenData.createdAt,
          expiresAt: tokenData.expiry
        })
      }
    }
    
    return sessions
  }

  getStats() {
    const activeTokens = Array.from(this.refreshTokens.values()).filter(t => t.isActive && Date.now() <= t.expiry)
    
    return {
      totalTokens: this.refreshTokens.size,
      activeTokens: activeTokens.length,
      activeSessions: this.userSessions.size,
      timestamp: new Date().toISOString()
    }
  }
}

export class AccessTokenBlacklist {
  constructor() {
    this.blacklistedTokens = new Set()
    
    // Token cleanup her 2 saatte bir (access token expiry 1.5 saat)
    setInterval(() => {
      this.cleanup()
    }, 2 * 60 * 60 * 1000)
  }

  addToBlacklist(token) {
    this.blacklistedTokens.add(token)
    console.log(`⚫ Access token blacklist'e eklendi`)
    
    // 1.6 saat sonra otomatik temizlik (access token expiry + buffer)
    setTimeout(() => {
      this.blacklistedTokens.delete(token)
    }, 1.6 * 60 * 60 * 1000)
  }

  isBlacklisted(token) {
    return this.blacklistedTokens.has(token)
  }

  cleanup() {
    // Periodic cleanup işlemi (Set'teki token'lar zaten timeout ile silinir)
    console.log(`🧹 Access token blacklist durumu: ${this.blacklistedTokens.size} adet`)
  }

  getStats() {
    return {
      blacklistedTokens: this.blacklistedTokens.size,
      timestamp: new Date().toISOString()
    }
  }
}

// Singleton instances
export const twoFactorAuth = new TwoFactorAuthService()
export const refreshTokenService = new RefreshTokenService()
export const accessTokenBlacklist = new AccessTokenBlacklist()
