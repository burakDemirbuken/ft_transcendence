import nodemailer from 'nodemailer'
import { config } from '../config/env.js'

class EmailService {
  constructor() {
    this.transporter = null
    this.initializeTransporter()
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: config.email.service,
        auth: {
          user: config.email.user,
          pass: config.email.pass
        }
      })

      console.log('📧 Email transporter initialized successfully')
    } catch (error) {
      console.error('❌ Email transporter initialization failed:', error.message)
      throw error
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify()
      console.log('✅ Email server connection verified')
      return true
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message)
      return false
    }
  }

  async sendEmailVerification(email, token, verificationUrl, username = null) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '✉️ Email Adresinizi Doğrulayın - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff; text-align: center;">✉️ Email Adresinizi Doğrulayın</h2>
            ${username ? `<p>Merhaba <strong>${username}</strong>,</p>` : '<p>Merhaba,</p>'}
            <p>ft_transcendence hesabınızı oluşturduğunuz için teşekkürler! Hesabınızı aktifleştirmek için email adresinizi doğrulamanız gerekiyor.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Email Adresimi Doğrula
              </a>
            </div>
            
            <p>Yukarıdaki butona tıklayamıyorsanız, aşağıdaki linki kopyalayıp tarayıcınıza yapıştırabilirsiniz:</p>
            <p style="background-color: #f4f4f4; padding: 10px; word-break: break-all; font-size: 12px;">
              ${verificationUrl}
            </p>
            
            <p><strong>Bu link 24 saat süreyle geçerlidir.</strong></p>
            
            <p style="color: #666; font-size: 12px;">
              Bu hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Team<br>
              ${new Date().toLocaleString('tr-TR')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log(`✅ Email doğrulama kodu gönderildi: ${email} - MessageId: ${info.messageId}`)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Email doğrulama kodu gönderilemedi: ${email}`, error.message)
      throw error
    }
  }

  async send2FACode(email, code, username = null) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '🔐 Giriş Doğrulama Kodu - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">🔐 Giriş Doğrulama Kodu</h2>
            ${username ? `<p>Merhaba <strong>${username}</strong>,</p>` : '<p>Merhaba,</p>'}
            <p>ft_transcendence hesabınıza giriş yapmak için aşağıdaki doğrulama kodunu kullanın:</p>
            
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
            </div>
            
            <p><strong>Bu kod 5 dakika süreyle geçerlidir.</strong></p>
            
            <p style="color: #666; font-size: 12px;">
              Bu giriş talebini siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Security Team<br>
              ${new Date().toLocaleString('tr-TR')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log(`✅ 2FA kodu gönderildi: ${email} - MessageId: ${info.messageId}`)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ 2FA kodu gönderilemedi: ${email}`, error.message)
      throw error
    }
  }

  async sendWelcomeEmail(email, username) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '🎉 Hoş Geldiniz - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745; text-align: center;">🎉 Hoş Geldiniz ft_transcendence'a!</h2>
            <p>Merhaba <strong>${username}</strong>,</p>
            <p>ft_transcendence topluluğuna katıldığınız için teşekkür ederiz!</p>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #28a745; margin-top: 0;">Hesabınız başarıyla oluşturuldu! ✅</h3>
              <ul>
                <li>Güvenli giriş sistemi</li>
                <li>İki faktörlü doğrulama</li>
                <li>Oyun geçmişi takibi</li>
                <li>Canlı sohbet</li>
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="${config.app.url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Şimdi Oyna! 🎮
              </a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Team<br>
              ${new Date().toLocaleString('tr-TR')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log(`✅ Hoş geldin e-postası gönderildi: ${email} - MessageId: ${info.messageId}`)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Hoş geldin e-postası gönderilemedi: ${email}`, error.message)
      throw error
    }
  }

  async sendLoginNotification(email, username, loginInfo = {}) {
    try {
      const { ip, userAgent, timestamp } = loginInfo
      
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '🔓 Hesap Giriş Bildirimi - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #17a2b8; text-align: center;">🔓 Hesap Giriş Bildirimi</h2>
            <p>Merhaba <strong>${username}</strong>,</p>
            <p>Hesabınıza başarılı bir giriş yapıldı:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #495057;">Giriş Detayları:</h4>
              <ul style="list-style: none; padding: 0;">
                <li><strong>🕐 Zaman:</strong> ${timestamp || new Date().toLocaleString('tr-TR')}</li>
                ${ip ? `<li><strong>🌐 IP Adresi:</strong> ${ip}</li>` : ''}
                ${userAgent ? `<li><strong>💻 Tarayıcı:</strong> ${userAgent}</li>` : ''}
              </ul>
            </div>
            
            <p style="color: #dc3545;">
              <strong>Bu giriş sizin değilse, derhal hesabınızın güvenliğini kontrol edin!</strong>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Security Team<br>
              Bu otomatik bir güvenlik bildirimidir.
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log(`✅ Giriş bildirimi gönderildi: ${email} - MessageId: ${info.messageId}`)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Giriş bildirimi gönderilemedi: ${email}`, error.message)
      throw error
    }
  }

  async sendAccountDeletionCode(email, username, code) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '⚠️ Hesap Silme Doğrulaması - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545; text-align: center;">⚠️ Hesap Silme Doğrulaması</h2>
            <p>Merhaba <strong>${username}</strong>,</p>
            <p style="color: #dc3545;"><strong>Hesabınızı kalıcı olarak silme talebinde bulundunuz.</strong></p>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #721c24; margin-top: 0;">⚠️ ÖNEMLİ UYARI</h3>
              <p style="color: #721c24; margin-bottom: 0;">Bu işlem <strong>GERİ ALINAMAZ</strong>. Tüm verileriniz kalıcı olarak silinecektir:</p>
              <ul style="color: #721c24;">
                <li>Profil bilgileriniz</li>
                <li>Oyun geçmişiniz</li>
                <li>Arkadaş listeniz</li>
                <li>Sohbet geçmişiniz</li>
              </ul>
            </div>
            
            <p>Hesabınızı silmek için aşağıdaki doğrulama kodunu kullanın:</p>
            
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #dc3545; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
            </div>
            
            <p><strong>Bu kod 5 dakika süreyle geçerlidir.</strong></p>
            
            <p style="color: #28a745;">
              <strong>Hesabınızı silmek istemiyorsanız, bu e-postayı görmezden gelin.</strong>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Security Team<br>
              ${new Date().toLocaleString('tr-TR')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log(`✅ Hesap silme kodu gönderildi: ${email} - MessageId: ${info.messageId}`)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Hesap silme kodu gönderilemedi: ${email}`, error.message)
      throw error
    }
  }

  async sendAccountDeletionConfirmation(email, username) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '✅ Hesap Silindi - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745; text-align: center;">✅ Hesap Başarıyla Silindi</h2>
            <p>Merhaba <strong>${username}</strong>,</p>
            <p>ft_transcendence hesabınız başarıyla silindi.</p>
            
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #155724; margin-top: 0;">Silinen Veriler:</h4>
              <ul style="color: #155724;">
                <li>Profil bilgileriniz</li>
                <li>Oyun geçmişiniz</li>
                <li>Arkadaş listeniz</li>
                <li>Sohbet geçmişiniz</li>
                <li>Tüm oturum bilgileriniz</li>
              </ul>
            </div>
            
            <p>Bizi tercih ettiğiniz için teşekkür ederiz. Gelecekte tekrar aramızda görmeyi umuyoruz!</p>
            
            <p style="text-align: center;">
              <a href="${config.app.url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Yeni Hesap Oluştur
              </a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Team<br>
              ${new Date().toLocaleString('tr-TR')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log(`✅ Hesap silme onayı gönderildi: ${email} - MessageId: ${info.messageId}`)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Hesap silme onayı gönderilemedi: ${email}`, error.message)
      throw error
    }
  }

  async sendPasswordResetCode(email, username, code) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '🔑 Şifre Sıfırlama Kodu - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ffc107; text-align: center;">🔑 Şifre Sıfırlama</h2>
            <p>Merhaba <strong>${username}</strong>,</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki doğrulama kodunu kullanın:</p>
            
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #ffc107; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
            </div>
            
            <p><strong>Bu kod 10 dakika süreyle geçerlidir.</strong></p>
            
            <p style="color: #666; font-size: 12px;">
              Bu şifre sıfırlama talebini siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Security Team<br>
              ${new Date().toLocaleString('tr-TR')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log(`✅ Şifre sıfırlama kodu gönderildi: ${email} - MessageId: ${info.messageId}`)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Şifre sıfırlama kodu gönderilemedi: ${email}`, error.message)
      throw error
    }
  }

  async sendEmailChangeRequest(email, username, changeUrl, token) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '🔄 Email Değişiklik İsteği - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff9800; text-align: center;">🔄 Email Adresinizi Değiştirin</h2>
            <p>Merhaba <strong>${username}</strong>,</p>
            <p>Hesabınıza ait email adresini değiştirmek için bir istek aldık. Email adresinizi değiştirmek istiyorsanız aşağıdaki butona tıklayın.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${changeUrl}" style="background-color: #ff9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                📧 Email Değiştir
              </a>
            </div>
            
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
              <h4 style="margin: 0 0 10px 0; color: #e65100;">⚠️ Güvenlik Uyarısı</h4>
              <p style="margin: 0;">
                • Bu işlemi siz yapmadıysanız, bu emaili görmezden gelin<br>
                • Link 24 saat geçerlidir<br>
                • Email değişikliği sonrasında yeniden giriş yapmanız gerekecek
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Eğer butona tıklayamıyorsanız, aşağıdaki linki kopyalayıp tarayıcınıza yapıştırın:<br>
              <a href="${changeUrl}" style="color: #ff9800; word-break: break-all;">${changeUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Bu email ft_transcendence tarafından gönderilmiştir.<br>
              Herhangi bir sorunuz varsa bizimle iletişime geçin.
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log(`✅ Email değişiklik isteği gönderildi: ${email} - MessageId: ${info.messageId}`)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Email değişiklik isteği gönderilemedi: ${email}`, error.message)
      throw error
    }
  }

  async sendNewEmailVerification(email, username, verificationUrl, token) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '✅ Yeni Email Adresinizi Doğrulayın - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4caf50; text-align: center;">✅ Yeni Email Adresinizi Doğrulayın</h2>
            <p>Merhaba <strong>${username}</strong>,</p>
            <p>ft_transcendence hesabınızın email adresini bu adrese değiştirmek istediğinizi belirttiniz. Email değişikliğini tamamlamak için aşağıdaki butona tıklayarak yeni email adresinizi doğrulayın.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                ✅ Email Adresimi Doğrula
              </a>
            </div>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <h4 style="margin: 0 0 10px 0; color: #2e7d32;">ℹ️ Önemli Bilgiler</h4>
              <p style="margin: 0;">
                • Bu doğrulama linkine tıkladığınızda email adresiniz değişecek<br>
                • Değişiklik sonrasında tüm cihazlardan çıkış yapılacak<br>
                • Yeni email adresinizle tekrar giriş yapmanız gerekecek<br>
                • Link 24 saat geçerlidir
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Eğer butona tıklayamıyorsanız, aşağıdaki linki kopyalayıp tarayıcınıza yapıştırın:<br>
              <a href="${verificationUrl}" style="color: #4caf50; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
              <h4 style="margin: 0 0 10px 0; color: #c62828;">⚠️ Bu İşlemi Siz Yapmadıysanız</h4>
              <p style="margin: 0; color: #666;">
                Eğer email değişiklik talebinde bulunmadıysanız, bu emaili görmezden gelin ve hesabınızın güvenliği için şifrenizi değiştirmeyi düşünün.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Bu email ft_transcendence tarafından gönderilmiştir.<br>
              Herhangi bir sorunuz varsa bizimle iletişime geçin.
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log(`✅ Yeni email doğrulama gönderildi: ${email} - MessageId: ${info.messageId}`)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Yeni email doğrulama gönderilemedi: ${email}`, error.message)
      throw error
    }
  }
}

export default new EmailService()
