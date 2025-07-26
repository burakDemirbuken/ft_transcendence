import crypto from 'crypto';

class User {
  constructor(username, email, password) {
    this.id = crypto.randomUUID();
    this.username = username;
    this.email = email;
    this.password = this.hashPassword(password);
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.isActive = true;
  }

  hashPassword(password) {
    // Basit hash (production'da bcrypt kullanın)
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  static validatePassword(inputPassword, hashedPassword) {
    const inputHash = crypto.createHash('sha256').update(inputPassword).digest('hex');
    return inputHash === hashedPassword;
  }

  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive
    };
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateUsername(username) {
    return username && username.length >= 3 && username.length <= 20;
  }

  static validatePassword(password) {
    return password && password.length >= 6;
  }
}

export default User;
