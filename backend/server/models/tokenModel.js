import db from '../config/db.js';
import crypto from 'crypto';

// Token hashle (userModel ile aynı)
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Refresh token kaydet
export const storeToken = ({ userId, token, tokenType, expiresAt, ipAddress, userAgent }) => {
  return new Promise((resolve, reject) => {
    const hashedToken = tokenType === 'refresh' ? hashToken(token) : token;
    const sql = `INSERT INTO tokens (user_id, token, token_type, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [userId, hashedToken, tokenType, expiresAt, ipAddress, userAgent], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Refresh token aktif mi kontrol et
export const isTokenActive = (token) => {
  return new Promise((resolve, reject) => {
    const hashedToken = hashToken(token);
    const sql = `SELECT * FROM tokens WHERE token = ? AND is_active = 1 AND expires_at > strftime('%s', 'now')`;
    db.get(sql, [hashedToken], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });
};

// Refresh token'ı pasif yap (logout)
export const deactivateToken = (token) => {
  return new Promise((resolve, reject) => {
    const hashedToken = hashToken(token);
    const sql = `UPDATE tokens SET is_active = 0 WHERE token = ?`;
    db.run(sql, [hashedToken], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Kullanıcının tüm refresh token'larını pasif yap
export const deactivateAllUserTokens = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE tokens SET is_active = 0 WHERE user_id = ?`;
    db.run(sql, [userId], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
};
