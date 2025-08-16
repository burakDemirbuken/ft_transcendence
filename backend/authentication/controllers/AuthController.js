import User from '../models/User.js'
import userRepository from '../models/UserRepository.js'
import { twoFactorAuth, refreshTokenService, accessTokenBlacklist } from '../utils/authServices.js'
import { emailService } from '../utils/emailClient.js'

class AuthController {
  // 1. REGISTER - Direct registration with immediate login
  async register(req, rep) {
    console.log("Register request received:", req.body)
    try {
      const { username, email, password } = req.body

      // Validasyon
      if (!username || !email || !password) {
        return rep.status(400).send({
          success: false,
          error: 'Username, email ve password gerekli'
        })
      }

      if (!User.validateEmail(email)) {
        return rep.status(400).send({
          success: false,
          error: 'Geçersiz email formatı'
        })
      }

      if (!User.validateUsername(username)) {
        return rep.status(400).send({
          success: false,
          error: 'Username 3-20 karakter arası, sadece harf, rakam ve _ kullanılabilir, harf ile başlamalı'
        })
      }

      if (!User.validatePassword(password)) {
        return rep.status(400).send({
          success: false,
          error: 'Password en az 6 karakter, büyük harf, küçük harf ve rakam içermeli'
        })
      }

      // Yeni user oluştur
      const newUser = new User(username, email, password)
      
      try {
        await userRepository.create(newUser)
      } catch (dbError) {
        return rep.status(409).send({
          success: false,
          error: dbError.message
        })
      }

      // Welcome email gönder (async, hata vermez)
      try {
        await emailService.sendWelcome(email, username)
        console.log('✅ Welcome email gönderildi:', email)
      } catch (emailError) {
        console.warn('⚠️ Welcome email gönderilemedi:', emailError.message)
      }

      // JWT token oluştur
      const accessToken = req.server.jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          username: newUser.username
        },
        { expiresIn: '1.5h' }
      )

      // Refresh token oluştur
      const { token: refreshToken } = await refreshTokenService.createRefreshToken(
        newUser.id,
        email,
        req.ip,
        req.headers['user-agent']
      )

      // Cookie'lere token'ları set et
      rep.setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1.5 * 60 * 60 // 1.5 saat
      })

      rep.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 6 * 60 * 60 // 6 saat
      })

      rep.status(201).send({
        success: true,
        message: 'Kullanıcı başarıyla kaydedildi ve giriş yapıldı',
        user: newUser.toSafeObject()
      })

    } catch (error) {
      req.log.error('Register error:', error)
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      })
    }
  }

  // 2. LOGIN - Step 1: Send 2FA code
  async login(req, rep) {
    console.log("Login request received:", req.body)
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return rep.status(400).send({
          success: false,
          error: 'Email ve password gerekli'
        })
      }

      // Kullanıcıyı bul
      const user = await userRepository.findByEmail(email)
      if (!user) {
        return rep.status(401).send({
          success: false,
          error: 'Geçersiz email veya şifre'
        })
      }

      // Şifre kontrolü
      if (!User.validatePassword(password, user.password)) {
        return rep.status(401).send({
          success: false,
          error: 'Geçersiz email veya şifre'
        })
      }

      // 2FA kodu oluştur ve gönder
      const code = await twoFactorAuth.storePending2FA(email, 'login', {
        userId: user.id,
        username: user.username,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      })

      // Email gönder
      try {
        await emailService.send2FA(email, code, user.username)
        console.log('✅ 2FA kodu gönderildi:', email)
      } catch (emailError) {
        console.error('❌ 2FA email gönderilemedi:', emailError.message)
        return rep.status(500).send({
          success: false,
          error: '2FA kodu gönderilemedi, tekrar deneyin'
        })
      }

      rep.send({
        success: true,
        message: '2FA kodu gönderildi. Lütfen e-posta kutunuzu kontrol edin.',
        email: email,
        step: 'verify-2fa'
      })

    } catch (error) {
      req.log.error('Login error:', error)
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      })
    }
  }

  // 3. VERIFY 2FA - Step 2: Verify code and complete login
  async verify2FA(req, rep) {
    console.log("Verify 2FA request received:", req.body)
    try {
      const { email, code, rememberMe = false } = req.body

      if (!email || !code) {
        return rep.status(400).send({
          success: false,
          error: 'Email ve code gerekli'
        })
      }

      // Code formatı kontrolü
      if (!/^\d{6}$/.test(code)) {
        return rep.status(400).send({
          success: false,
          error: 'Geçersiz kod formatı'
        })
      }

      // 2FA doğrula
      let userData
      try {
        userData = await twoFactorAuth.verifyCode(email, code, 'login')
      } catch (twoFAError) {
        return rep.status(401).send({
          success: false,
          error: twoFAError.message
        })
      }

      // User'ı güncelle
      const user = await userRepository.findById(userData.userId)
      if (!user) {
        return rep.status(404).send({
          success: false,
          error: 'Kullanıcı bulunamadı'
        })
      }

      user.markLogin()

      // JWT token oluştur
      const accessToken = req.server.jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username
        },
        { expiresIn: '1.5h' }
      )

      // Refresh token oluştur
      const { token: refreshToken } = await refreshTokenService.createRefreshToken(
        user.id,
        email,
        userData.ip,
        userData.userAgent,
        rememberMe
      )

      // Cookie'lere token'ları set et
      rep.setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1.5 * 60 * 60 // 1.5 saat
      })

      rep.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 6 * 60 * 60 // 30 gün : 6 saat
      })

      // Login bildirimi gönder (async)
      try {
        await emailService.sendLoginNotification(email, user.username, {
          ip: userData.ip,
          userAgent: userData.userAgent,
          timestamp: new Date().toLocaleString('tr-TR')
        })
        console.log('✅ Login bildirimi gönderildi:', email)
      } catch (emailError) {
        console.warn('⚠️ Login bildirimi gönderilemedi:', emailError.message)
      }

      rep.send({
        success: true,
        message: 'Giriş başarılı - Token\'lar cookie olarak set edildi',
        user: user.toSafeObject(),
        debug: {
          accessTokenCookie: true,
          refreshTokenCookie: true,
          accessExpiry: 1.5 * 60 * 60, // 1.5 saat
          refreshExpiry: rememberMe ? 30 * 24 * 60 * 60 : 6 * 60 * 60
        }
      })

    } catch (error) {
      req.log.error('Verify 2FA error:', error)
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      })
    }
  }

  // 4. REFRESH TOKEN - Yeni access token al
  async refreshToken(req, rep) {
    console.log("Refresh token request received")
    try {
      const refreshToken = req.cookies?.refreshToken

      if (!refreshToken) {
        return rep.status(400).send({
          success: false,
          error: 'Refresh token bulunamadı'
        })
      }

      // Refresh token doğrula
      let tokenData
      try {
        tokenData = await refreshTokenService.validateRefreshToken(
          refreshToken,
          req.ip,
          req.headers['user-agent']
        )
      } catch (tokenError) {
        rep.clearCookie('refreshToken')
        return rep.status(401).send({
          success: false,
          error: tokenError.message
        })
      }

      // User'ı kontrol et
      const user = await userRepository.findById(tokenData.userId)
      if (!user || !user.isActive) {
        await refreshTokenService.deactivateToken(refreshToken)
        rep.clearCookie('refreshToken')
        return rep.status(401).send({
          success: false,
          error: 'Kullanıcı bulunamadı veya aktif değil'
        })
      }

      // Yeni access token oluştur
      const newAccessToken = req.server.jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username
        },
        { expiresIn: '1.5h' }
      )

      // Cookie'ye yeni access token'ı set et
      rep.setCookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1.5 * 60 * 60 // 1.5 saat
      })

      rep.send({
        success: true,
        message: 'Token yenilendi',
        debug: {
          newAccessTokenSet: true,
          expires: 1.5 * 60 * 60 // 1.5 saat
        }
      })

    } catch (error) {
      req.log.error('Refresh token error:', error)
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      })
    }
  }

  // 5. LOGOUT - Tüm session'ları sonlandır
  async logout(req, rep) {
    console.log("Logout request received")
    try {
      const accessToken = req.cookies?.accessToken
      const refreshToken = req.cookies?.refreshToken

      // Access token'ı blacklist'e ekle
      if (accessToken) {
        accessTokenBlacklist.addToBlacklist(accessToken)
      }

      // Refresh token'ı deaktif et
      if (refreshToken) {
        await refreshTokenService.deactivateToken(refreshToken)
      }

      // JWT'den user ID'yi al (hata olsa bile devam et)
      let userId = null
      try {
        const decoded = req.server.jwt.decode(accessToken)
        userId = decoded?.userId
      } catch (jwtError) {
        console.warn('JWT decode hatası (logout):', jwtError.message)
      }

      // Kullanıcının tüm session'larını deaktif et
      if (userId) {
        await refreshTokenService.deactivateAllUserTokens(userId)
      }

      // Cookie'leri temizle
      rep.clearCookie('accessToken')
      rep.clearCookie('refreshToken')

      rep.send({
        success: true,
        message: 'Çıkış başarılı',
        info: 'Tüm cookie\'ler temizlendi'
      })

    } catch (error) {
      req.log.error('Logout error:', error)
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      })
    }
  }

  // 6. ME - Mevcut kullanıcı bilgilerini al
  async me(req, rep) {
    try {
      // JWT middleware'den gelen user bilgisi
      const userId = req.user.userId
      
      const user = await userRepository.findById(userId)
      if (!user) {
        return rep.status(404).send({
          success: false,
          error: 'Kullanıcı bulunamadı'
        })
      }

      rep.send({
        success: true,
        user: user.toSafeObject()
      })

    } catch (error) {
      req.log.error('Me error:', error)
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      })
    }
  }

  // 7. STATS - Service istatistikleri
  async stats(req, rep) {
    try {
      const userCount = await userRepository.count()
      const twoFAStats = twoFactorAuth.getStats()
      const refreshTokenStats = refreshTokenService.getStats()
      const blacklistStats = accessTokenBlacklist.getStats()
      
      rep.send({
        success: true,
        stats: {
          totalUsers: userCount,
          service: 'authentication',
          version: '1.0.0',
          twoFactorAuth: twoFAStats,
          refreshTokens: refreshTokenStats,
          blacklistedTokens: blacklistStats
        }
      })

    } catch (error) {
      req.log.error('Stats error:', error)
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      })
    }
  }

  // 8. CHECK EMAIL - Email kullanılabilirlik kontrolü
  async checkEmail(req, rep) {
    try {
      const { email } = req.query

      if (!email) {
        return rep.status(400).send({
          success: false,
          error: 'Email parametresi gerekli'
        })
      }

      if (!User.validateEmail(email)) {
        return rep.status(400).send({
          success: false,
          error: 'Geçersiz email formatı'
        })
      }

      const user = await userRepository.findByEmail(email)
      const exists = !!user

      rep.send({
        success: true,
        exists,
        message: exists ? 'E-posta adresi kullanımda' : 'E-posta adresi kullanılabilir'
      })

    } catch (error) {
      req.log.error('Check email error:', error)
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      })
    }
  }

  // 9. CHECK USERNAME - Username kullanılabilirlik kontrolü
  async checkUsername(req, rep) {
    try {
      const { username } = req.query

      if (!username) {
        return rep.status(400).send({
          success: false,
          error: 'Username parametresi gerekli'
        })
      }

      if (!User.validateUsername(username)) {
        return rep.status(400).send({
          success: false,
          error: 'Geçersiz username formatı'
        })
      }

      const user = await userRepository.findByUsername(username)
      const exists = !!user

      rep.send({
        success: true,
        exists,
        message: exists ? 'Kullanıcı adı kullanımda' : 'Kullanıcı adı kullanılabilir'
      })

    } catch (error) {
      req.log.error('Check username error:', error)
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      })
    }
  }
}

export default new AuthController()
