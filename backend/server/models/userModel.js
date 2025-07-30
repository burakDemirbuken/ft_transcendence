import db from '../config/db.js';
import crypto from 'crypto';

// Kullanıcı oluştur
export const createUser = ({ username, email, password }) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    db.run(sql, [username, email, password], function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
};

// Kullanıcı ID ile bul
export const findUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// E-posta ile bul
export const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Kullanıcı adı ile bul
export const findUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Kullanıcı sil
export const deleteUser = (userId) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM users WHERE id = ?`, [userId], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

// Token hashle (SHA256)
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Refresh session kaydet (yeni tokens tablosuna)
export const storeRefreshSession = ({ userId, token, ip, userAgent, expiresIn }) => {
  return new Promise((resolve, reject) => {
    const hashed = hashToken(token);
    const expiresAt = Math.floor((Date.now() + msToMs(expiresIn)) / 1000); // Unix timestamp
    const createdAt = Math.floor(Date.now() / 1000);

    const sql = `INSERT INTO tokens 
      (user_id, token, token_type, ip_address, user_agent, expires_at, created_at)
      VALUES (?, ?, 'refresh', ?, ?, ?, ?)`;

    db.run(sql, [userId, hashed, ip, userAgent, expiresAt, createdAt], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Refresh session doğrula (yeni tokens tablosundan)
export const isRefreshSessionValid = ({ token, userId, ip, userAgent }) => {
  return new Promise((resolve, reject) => {
    const hashed = hashToken(token);
    const now = Math.floor(Date.now() / 1000); // Unix timestamp
    const sql = `SELECT * FROM tokens 
      WHERE user_id = ? AND token = ? AND token_type = 'refresh' AND ip_address = ? AND user_agent = ? AND expires_at > ? AND is_active = 1`;

    db.get(sql, [userId, hashed, ip, userAgent, now], (err, row) => {
      if (err) return reject(err);
      resolve(!!row); // varsa true döner
    });
  });
};

// Logout: Refresh session sil (yeni tokens tablosundan)
export const deleteRefreshSession = ({ userId, ip, userAgent }) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE tokens SET is_active = 0 
      WHERE user_id = ? AND token_type = 'refresh' AND ip_address = ? AND user_agent = ?`;
    db.run(sql, [userId, ip, userAgent], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

// "7d" gibi süreyi ms'e çevir
const msToMs = (input) => {
  const match = /^(\d+)([smhd])$/.exec(input);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 0;
  }
};
