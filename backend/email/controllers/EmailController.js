import EmailService from '../services/EmailService.js'

class EmailController {
  async sendVerification(req, rep) {
    try {
      const { to, username, verificationUrl, token } = req.body

      if (!to || !token || !verificationUrl) {
        return rep.status(400).send({
          success: false,
          error: 'Email, token ve verificationUrl gerekli'
        })
      }

      // Email format kontrolü
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(to)) {
        return rep.status(400).send({
          success: false,
          error: 'Geçersiz email formatı'
        })
      }

      const result = await EmailService.sendEmailVerification(to, token, verificationUrl, username)
      
      rep.send({
        success: true,
        message: 'Email doğrulama kodu başarıyla gönderildi',
        data: {
          email: result.email,
          messageId: result.messageId
        }
      })

    } catch (error) {
      req.log.error('Email verification error:', error)
      rep.status(500).send({
        success: false,
        error: 'Email doğrulama kodu gönderilemedi',
        details: error.message
      })
    }
  }

  async send2FA(req, rep) {
    try {
      const { email, code, username, type = 'login' } = req.body

      if (!email || !code) {
        return rep.status(400).send({
          success: false,
          error: 'Email ve code gerekli'
        })
      }

      // Email format kontrolü
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return rep.status(400).send({
          success: false,
          error: 'Geçersiz email formatı'
        })
      }

      if (!/^\d{6}$/.test(code)) {
        return rep.status(400).send({
          success: false,
          error: 'Code 6 haneli sayı olmalı'
        })
      }

      const result = await EmailService.send2FACode(email, code, username, type)
      
      rep.send({
        success: true,
        message: '2FA kodu başarıyla gönderildi',
        data: {
          email: result.email,
          messageId: result.messageId
        }
      })

    } catch (error) {
      req.log.error('2FA email error:', error)
      rep.status(500).send({
        success: false,
        error: '2FA e-postası gönderilemedi',
        details: error.message
      })
    }
  }

  async sendLoginNotification(req, rep) {
    try {
      const { email, username, loginInfo } = req.body

      if (!email || !username) {
        return rep.status(400).send({
          success: false,
          error: 'Email ve username gerekli'
        })
      }

      // Email format kontrolü
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return rep.status(400).send({
          success: false,
          error: 'Geçersiz email formatı'
        })
      }

      const enrichedLoginInfo = {
        ip: loginInfo?.ip || req.ip || 'Bilinmiyor',
        userAgent: loginInfo?.userAgent || req.headers['user-agent'] || 'Bilinmiyor',
        timestamp: loginInfo?.timestamp || new Date().toLocaleString('tr-TR')
      }

      const result = await EmailService.sendLoginNotification(email, username, enrichedLoginInfo)
      
      rep.send({
        success: true,
        message: 'Giriş bildirimi başarıyla gönderildi',
        data: {
          email: result.email,
          messageId: result.messageId
        }
      })

    } catch (error) {
      req.log.error('Login notification email error:', error)
      rep.status(500).send({
        success: false,
        error: 'Giriş bildirimi gönderilemedi',
        details: error.message
      })
    }
  }
}

export default new EmailController()
