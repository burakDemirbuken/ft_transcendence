import EmailService from '../services/EmailService.js'

class EmailController {
  async sendVerification(req, rep) {
    try {
      const { to, username, verificationUrl, token } = req.body

      if (!to || !token || !verificationUrl) {
        return rep.status(400).send({
          success: false,
          error: 'Email, token, and verificationUrl are required'
        })
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(to)) {
        return rep.status(400).send({
          success: false,
          error: 'Invalid email format'
        })
      }

      const result = await EmailService.sendEmailVerification(to, token, verificationUrl, username)
      
      rep.send({
        success: true,
        message: 'Email verification code sent successfully',
        data: {
          email: result.email,
          messageId: result.messageId
        }
      })

    } catch (error) {
      req.log.error('Email verification error:', error)
      rep.status(500).send({
        success: false,
        error: 'Failed to send email verification code',
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
          error: 'Email and code are required'
        })
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return rep.status(400).send({
          success: false,
          error: 'Invalid email format'
        })
      }

      if (!/^\d{6}$/.test(code)) {
        return rep.status(400).send({
          success: false,
          error: 'Code must be a 6-digit number'
        })
      }

      const result = await EmailService.send2FACode(email, code, username, type)
      
      rep.send({
        success: true,
        message: '2FA code sent successfully',
        data: {
          email: result.email,
          messageId: result.messageId
        }
      })

    } catch (error) {
      req.log.error('2FA email error:', error)
      rep.status(500).send({
        success: false,
        error: 'Failed to send 2FA email',
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
          error: 'Email and username are required'
        })
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return rep.status(400).send({
          success: false,
          error: 'Invalid email format'
        })
      }

      const enrichedLoginInfo = {
        ip: loginInfo?.ip || req.ip || 'Unknown',
        userAgent: loginInfo?.userAgent || req.headers['user-agent'] || 'Unknown',
        timestamp: loginInfo?.timestamp || new Date().toLocaleString('en-US')
      }

      const result = await EmailService.sendLoginNotification(email, username, enrichedLoginInfo)
      
      rep.send({
        success: true,
        message: 'Login notification sent successfully',
        data: {
          email: result.email,
          messageId: result.messageId
        }
      })

    } catch (error) {
      req.log.error('Login notification email error:', error)
      rep.status(500).send({
        success: false,
        error: 'Failed to send login notification',
        details: error.message
      })
    }
  }
}

export default new EmailController()
