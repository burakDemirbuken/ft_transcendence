import EmailService from '../services/EmailService.js'

class EmailController {
  async sendVerification(req, rep) {
    try {
      const { to, username, verificationUrl, token } = req.body

      // Validasyon
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
      const { email, code, username } = req.body

      // Validasyon
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

      // Code formatı kontrolü (6 haneli sayı)
      if (!/^\d{6}$/.test(code)) {
        return rep.status(400).send({
          success: false,
          error: 'Code 6 haneli sayı olmalı'
        })
      }

      const result = await EmailService.send2FACode(email, code, username)
      
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

  async sendWelcome(req, rep) {
    try {
      const { email, username } = req.body

      // Validasyon
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

      const result = await EmailService.sendWelcomeEmail(email, username)
      
      rep.send({
        success: true,
        message: 'Hoş geldin e-postası başarıyla gönderildi',
        data: {
          email: result.email,
          messageId: result.messageId
        }
      })

    } catch (error) {
      req.log.error('Welcome email error:', error)
      rep.status(500).send({
        success: false,
        error: 'Hoş geldin e-postası gönderilemedi',
        details: error.message
      })
    }
  }

  async sendLoginNotification(req, rep) {
    try {
      const { email, username, loginInfo } = req.body

      // Validasyon
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

      // loginInfo varsayılan değerleri
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

  async sendDeletionCode(req, rep) {
    try {
      const { email, username, code } = req.body

      // Validasyon
      if (!email || !username || !code) {
        return rep.status(400).send({
          success: false,
          error: 'Email, username ve code gerekli'
        })
      }

      // Code formatı kontrolü (6 haneli sayı)
      if (!/^\d{6}$/.test(code)) {
        return rep.status(400).send({
          success: false,
          error: 'Code 6 haneli sayı olmalı'
        })
      }

      const result = await EmailService.sendAccountDeletionCode(email, username, code)
      
      rep.send({
        success: true,
        message: 'Hesap silme kodu başarıyla gönderildi',
        data: {
          email: result.email,
          messageId: result.messageId
        }
      })

    } catch (error) {
      req.log.error('Account deletion code email error:', error)
      rep.status(500).send({
        success: false,
        error: 'Hesap silme kodu gönderilemedi',
        details: error.message
      })
    }
  }

  async sendDeletionConfirmation(req, rep) {
    try {
      const { email, username } = req.body

      // Validasyon
      if (!email || !username) {
        return rep.status(400).send({
          success: false,
          error: 'Email ve username gerekli'
        })
      }

      const result = await EmailService.sendAccountDeletionConfirmation(email, username)
      
      rep.send({
        success: true,
        message: 'Hesap silme onayı başarıyla gönderildi',
        data: {
          email: result.email,
          messageId: result.messageId
        }
      })

    } catch (error) {
      req.log.error('Account deletion confirmation email error:', error)
      rep.status(500).send({
        success: false,
        error: 'Hesap silme onayı gönderilemedi',
        details: error.message
      })
    }
  }

  async sendPasswordReset(req, rep) {
    try {
      const { email, username, code } = req.body

      // Validasyon
      if (!email || !username || !code) {
        return rep.status(400).send({
          success: false,
          error: 'Email, username ve code gerekli'
        })
      }

      // Code formatı kontrolü (6 haneli sayı)
      if (!/^\d{6}$/.test(code)) {
        return rep.status(400).send({
          success: false,
          error: 'Code 6 haneli sayı olmalı'
        })
      }

      const result = await EmailService.sendPasswordResetCode(email, username, code)
      
      rep.send({
        success: true,
        message: 'Şifre sıfırlama kodu başarıyla gönderildi',
        data: {
          email: result.email,
          messageId: result.messageId
        }
      })

    } catch (error) {
      req.log.error('Password reset email error:', error)
      rep.status(500).send({
        success: false,
        error: 'Şifre sıfırlama kodu gönderilemedi',
        details: error.message
      })
    }
  }

  async sendEmailChange(req, rep) {
    try {
      const { to, username, changeUrl, token } = req.body

      if (!to || !username || !changeUrl || !token) {
        return rep.status(400).send({
          success: false,
          error: 'Missing required fields: to, username, changeUrl, token'
        })
      }

      if (!to.includes('@')) {
        return rep.status(400).send({
          success: false,
          error: 'Invalid email format'
        })
      }

      const result = await EmailService.sendEmailChangeRequest(to, username, changeUrl, token)

      rep.send({
        success: true,
        message: 'Email change request sent successfully',
        data: result
      })

    } catch (error) {
      req.log.error('Send email change error:', error)
      rep.status(500).send({
        success: false,
        error: 'Email change request could not be sent',
        details: error.message
      })
    }
  }

  async sendPasswordChange(req, rep) {
    try {
      const { to, username, changeUrl, token } = req.body

      if (!to || !username || !changeUrl || !token) {
        return rep.status(400).send({
          success: false,
          error: 'Missing required fields: to, username, changeUrl, token'
        })
      }

      if (!to.includes('@')) {
        return rep.status(400).send({
          success: false,
          error: 'Invalid email format'
        })
      }

      const result = await EmailService.sendPasswordChangeRequest(to, username, changeUrl, token)

      rep.send({
        success: true,
        message: 'Password change request sent successfully',
        data: result
      })

    } catch (error) {
      req.log.error('Send password change error:', error)
      rep.status(500).send({
        success: false,
        error: 'Password change request could not be sent',
        details: error.message
      })
    }
  }

  async sendNewEmailVerification(req, rep) {
    try {
      const { to, username, verificationUrl, token } = req.body

      if (!to || !username || !verificationUrl || !token) {
        return rep.status(400).send({
          success: false,
          error: 'Missing required fields: to, username, verificationUrl, token'
        })
      }

      if (!to.includes('@')) {
        return rep.status(400).send({
          success: false,
          error: 'Invalid email format'
        })
      }

      const result = await EmailService.sendNewEmailVerification(to, username, verificationUrl, token)

      rep.send({
        success: true,
        message: 'New email verification sent successfully',
        data: result
      })

    } catch (error) {
      req.log.error('Send new email verification error:', error)
      rep.status(500).send({
        success: false,
        error: 'New email verification could not be sent',
        details: error.message
      })
    }
  }

  async testConnection(req, rep) {
    try {
      const isConnected = await EmailService.verifyConnection()
      
      rep.send({
        success: isConnected,
        message: isConnected ? 'Email servisi bağlantısı aktif' : 'Email servisi bağlantısı başarısız',
        data: {
          connected: isConnected,
          service: 'email-service',
          timestamp: new Date().toISOString()
        }
      })

    } catch (error) {
      req.log.error('Email connection test error:', error)
      rep.status(500).send({
        success: false,
        error: 'Email bağlantısı test edilemedi',
        details: error.message
      })
    }
  }
}

export default new EmailController()
