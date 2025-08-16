// Email service ile iletişim için HTTP client
export class EmailServiceClient {
  constructor() {
    this.baseURL = process.env.EMAIL_SERVICE_URL || 'http://email:3005'
  }

  async send2FA(email, code, username = null) {
    try {
      const response = await fetch(`${this.baseURL}/send-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          username
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Email gönderme hatası')
      }

      return data
    } catch (error) {
      console.error('❌ Email service - 2FA gönderme hatası:', error.message)
      throw error
    }
  }

  async sendWelcome(email, username) {
    try {
      const response = await fetch(`${this.baseURL}/send-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Email gönderme hatası')
      }

      return data
    } catch (error) {
      console.error('❌ Email service - Hoş geldin e-postası hatası:', error.message)
      throw error
    }
  }

  async sendLoginNotification(email, username, loginInfo = {}) {
    try {
      const response = await fetch(`${this.baseURL}/send-login-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          loginInfo
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Email gönderme hatası')
      }

      return data
    } catch (error) {
      console.error('❌ Email service - Giriş bildirimi hatası:', error.message)
      throw error
    }
  }

  async sendDeletionCode(email, username, code) {
    try {
      const response = await fetch(`${this.baseURL}/send-deletion-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          code
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Email gönderme hatası')
      }

      return data
    } catch (error) {
      console.error('❌ Email service - Hesap silme kodu hatası:', error.message)
      throw error
    }
  }

  async sendDeletionConfirmation(email, username) {
    try {
      const response = await fetch(`${this.baseURL}/send-deletion-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Email gönderme hatası')
      }

      return data
    } catch (error) {
      console.error('❌ Email service - Hesap silme onayı hatası:', error.message)
      throw error
    }
  }

  async sendPasswordReset(email, username, code) {
    try {
      const response = await fetch(`${this.baseURL}/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          code
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Email gönderme hatası')
      }

      return data
    } catch (error) {
      console.error('❌ Email service - Şifre sıfırlama kodu hatası:', error.message)
      throw error
    }
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/test-connection`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Email service bağlantısı test edilemedi:', error.message)
      return { success: false, error: error.message }
    }
  }
}

export const emailService = new EmailServiceClient()
