import { DataTypes } from 'sequelize';
import sequelize from './database.js';
import bcrypt from 'bcryptjs';

/**
 * Simplified User Model
 * Core fields only: id, username, email, password, is_active, last_login_at
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true,
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refresh_token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  remember_me: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['username']
    }
  ]
});

/**
 * Hash password before creating user
 */
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

/**
 * Hash password before updating user
 */
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

/**
 * Instance Methods
 */
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.markLogin = async function() {
  this.last_login_at = new Date();
  await this.save();
};

User.prototype.setRefreshToken = async function(refreshToken, rememberMe = false) {
  this.refresh_token = refreshToken;
  this.remember_me = rememberMe; // Remember me durumunu kaydet
  // Remember me açıksa 30 gün, değilse 3 gün
  const expiryDays = rememberMe ? 30 : 3;
  this.refresh_token_expires_at = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  await this.save();
};

User.prototype.clearRefreshToken = async function() {
  this.refresh_token = null;
  this.refresh_token_expires_at = null;
  await this.save();
};

User.prototype.isRefreshTokenValid = function(refreshToken) {
  return this.refresh_token === refreshToken && 
         this.refresh_token_expires_at && 
         this.refresh_token_expires_at > new Date();
};

User.prototype.toSafeObject = function() {
  const obj = this.toJSON();
  delete obj.password;
  return obj;
};

/**
 * Static Methods
 */
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email: email.toLowerCase() } });
};

User.findByUsername = async function(username) {
  return await this.findOne({ where: { username } });
};

export default User;
