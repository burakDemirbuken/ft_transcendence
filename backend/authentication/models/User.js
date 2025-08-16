import bcrypt from 'bcryptjs'
import crypto from 'crypto'

class User {
  constructor(username, email, password) {
    this.id = crypto.randomUUID()
    this.username = username
    this.email = email
    this.password = this.hashPassword(password)
    this.createdAt = new Date().toISOString()
    this.updatedAt = new Date().toISOString()
    this.isActive = true
    this.emailVerified = false
    this.lastLoginAt = null
  }

  hashPassword(password) {
    const saltRounds = 10
    return bcrypt.hashSync(password, saltRounds)
  }

  static validatePassword(inputPassword, hashedPassword) {
    return bcrypt.compareSync(inputPassword, hashedPassword)
  }

  updatePassword(newPassword) {
    this.password = this.hashPassword(newPassword)
    this.updatedAt = new Date().toISOString()
  }

  markLogin() {
    this.lastLoginAt = new Date().toISOString()
    this.updatedAt = new Date().toISOString()
  }

  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      isActive: this.isActive,
      emailVerified: this.emailVerified
    }
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validateUsername(username) {
    if (!username) return false
    if (username.length < 3 || username.length > 20) return false
    // Alphanumeric ve underscore, sadece harf ile başlayabilir
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/
    return usernameRegex.test(username)
  }

  static validatePassword(password) {
    if (!password) return false
    if (password.length < 6) return false
    // En az bir büyük harf, bir küçük harf, bir rakam
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    return passwordRegex.test(password)
  }
}

export default User
