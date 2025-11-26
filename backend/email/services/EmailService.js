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
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        rateLimit: 5,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 15000,
        secure: true,
        requireTLS: true
      })

    } catch (error) {
      console.error('❌ Email transporter initialization failed:', error.message)
      throw error
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify()
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
        subject: '✉️ Verify Your Email - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff; text-align: center;">✉️ Verify Your Email Address</h2>
            ${username ? `<p>Hello <strong>${username}</strong>,</p>` : '<p>Hello,</p>'}
            <p>Thank you for creating your ft_transcendence account! You need to verify your email address to activate your account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verify My Email
              </a>
            </div>
            
            <p>If you can't click the button above, you can copy and paste the following link into your browser:</p>
            <p style="background-color: #f4f4f4; padding: 10px; word-break: break-all; font-size: 12px;">
              ${verificationUrl}
            </p>
            
            <p><strong>This link is valid for 24 hours.</strong></p>
            
            <p style="color: #666; font-size: 12px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Team<br>
              ${new Date().toLocaleString('en-US')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Failed to send email verification: ${email}`, error.message)
      throw error
    }
  }

  async send2FACode(email, code, username = null, type = 'login') {
    try {
      const emailContents = {
        login: {
          icon: '🔐',
          subject: '🔐 Login Verification Code - ft_transcendence',
          title: '🔐 Login Verification Code',
          message: 'Use the verification code below to log in to your ft_transcendence account:',
          warning: 'If you didn\'t make this login request, you can safely ignore this email.'
        },
        password_change: {
          icon: '🔑',
          subject: '🔑 Password Change Verification Code - ft_transcendence',
          title: '🔑 Password Change Verification',
          message: 'Use the verification code below to change your password:',
          warning: 'If you didn\'t request this password change, please check your account security immediately.'
        },
        email_change: {
          icon: '✉️',
          subject: '✉️ Email Change Verification Code - ft_transcendence',
          title: '✉️ Email Change Verification',
          message: 'Use the verification code below to change your email address:',
          warning: 'If you didn\'t request this email change, please check your account security immediately.'
        },
        password_reset: {
          icon: '🔄',
          subject: '🔄 Password Reset Code - ft_transcendence',
          title: '🔄 Password Reset',
          message: 'Use the verification code below to reset your password:',
          warning: 'If you didn\'t request this password reset, you can safely ignore this email.'
        },
        delete_account: {
          icon: '⚠️',
          subject: '⚠️ Account Deletion Verification Code - ft_transcendence',
          title: '⚠️ Account Deletion Confirmation',
          message: 'Use the verification code below to delete your account:',
          warning: 'If you didn\'t request this account deletion, please check your account security and change your password immediately!'
        }
      }

      const content = emailContents[type] || emailContents.login

      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: content.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">${content.title}</h2>
            ${username ? `<p>Hello <strong>${username}</strong>,</p>` : '<p>Hello,</p>'}
            <p>${content.message}</p>
            
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
            </div>
            
            <p><strong>This code is valid for 10 minutes.</strong></p>
            
            <p style="color: #ff6b35; font-size: 14px; font-weight: bold;">
              ${content.warning}
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Security Team<br>
              ${new Date().toLocaleString('en-US')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Failed to send 2FA code: ${email}`, error.message)
      throw error
    }
  }

  async sendWelcomeEmail(email, username) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '🎉 Welcome - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745; text-align: center;">🎉 Welcome to ft_transcendence!</h2>
            <p>Hello <strong>${username}</strong>,</p>
            <p>Thank you for joining the ft_transcendence community!</p>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #28a745; margin-top: 0;">Your account has been successfully created! ✅</h3>
              <ul>
                <li>Secure login system</li>
                <li>Two-factor authentication</li>
                <li>Game history tracking</li>
                <li>Live chat</li>
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="${config.app.url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Play Now! 🎮
              </a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Team<br>
              ${new Date().toLocaleString('en-US')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Failed to send welcome email: ${email}`, error.message)
      throw error
    }
  }

  async sendLoginNotification(email, username, loginInfo = {}) {
    try {
      const { ip, userAgent, timestamp } = loginInfo
      
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '🔓 Account Login Notification - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #17a2b8; text-align: center;">🔓 Account Login Notification</h2>
            <p>Hello <strong>${username}</strong>,</p>
            <p>A successful login was made to your account:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #495057;">Login Details:</h4>
              <ul style="list-style: none; padding: 0;">
                <li><strong>🕐 Time:</strong> ${timestamp || new Date().toLocaleString('en-US')}</li>
                ${ip ? `<li><strong>🌐 IP Address:</strong> ${ip}</li>` : ''}
                ${userAgent ? `<li><strong>💻 Browser:</strong> ${userAgent}</li>` : ''}
              </ul>
            </div>
            
            <p style="color: #dc3545;">
              <strong>If this login wasn't you, please check your account security immediately!</strong>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Security Team<br>
              This is an automated security notification.
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Failed to send login notification: ${email}`, error.message)
      throw error
    }
  }

  async sendAccountDeletionCode(email, username, code) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '⚠️ Account Deletion Verification - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545; text-align: center;">⚠️ Account Deletion Verification</h2>
            <p>Hello <strong>${username}</strong>,</p>
            <p style="color: #dc3545;"><strong>You have requested to permanently delete your account.</strong></p>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #721c24; margin-top: 0;">⚠️ IMPORTANT WARNING</h3>
              <p style="color: #721c24; margin-bottom: 0;">This action is <strong>IRREVERSIBLE</strong>. All your data will be permanently deleted:</p>
              <ul style="color: #721c24;">
                <li>Profile information</li>
                <li>Game history</li>
                <li>Friend list</li>
                <li>Chat history</li>
              </ul>
            </div>
            
            <p>Use the verification code below to delete your account:</p>
            
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #dc3545; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
            </div>
            
            <p><strong>This code is valid for 5 minutes.</strong></p>
            
            <p style="color: #28a745;">
              <strong>If you don't want to delete your account, simply ignore this email.</strong>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Security Team<br>
              ${new Date().toLocaleString('en-US')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Failed to send account deletion code: ${email}`, error.message)
      throw error
    }
  }

  async sendAccountDeletionConfirmation(email, username) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '✅ Account Deleted - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745; text-align: center;">✅ Account Successfully Deleted</h2>
            <p>Hello <strong>${username}</strong>,</p>
            <p>Your ft_transcendence account has been successfully deleted.</p>
            
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #155724; margin-top: 0;">Deleted Data:</h4>
              <ul style="color: #155724;">
                <li>Profile information</li>
                <li>Game history</li>
                <li>Friend list</li>
                <li>Chat history</li>
                <li>All session data</li>
              </ul>
            </div>
            
            <p>Thank you for choosing us. We hope to see you again in the future!</p>
            
            <p style="text-align: center;">
              <a href="${config.app.url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Create New Account
              </a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Team<br>
              ${new Date().toLocaleString('en-US')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Failed to send account deletion confirmation: ${email}`, error.message)
      throw error
    }
  }

  async sendPasswordResetCode(email, username, code) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '🔑 Password Reset Code - ft_transcendence',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ffc107; text-align: center;">🔑 Password Reset</h2>
            <p>Hello <strong>${username}</strong>,</p>
            <p>Use the verification code below to reset your password:</p>
            
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #ffc107; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
            </div>
            
            <p><strong>This code is valid for 10 minutes.</strong></p>
            
            <p style="color: #666; font-size: 12px;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ft_transcendence Security Team<br>
              ${new Date().toLocaleString('en-US')}
            </p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: info.messageId,
        email: email
      }
    } catch (error) {
      console.error(`❌ Failed to send password reset code: ${email}`, error.message)
      throw error
    }
  }
}

export default new EmailService()
