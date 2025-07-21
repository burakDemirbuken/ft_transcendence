import db from '../config/db.js';

export const createUser = (user) =>
  new Promise((resolve, reject) => {
    const { username, email, password } = user;
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.run(sql, [username, email, password], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });

export const findUserByUsername = (username) =>
  new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

export const findUserById = (id) =>
  new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

export const findUserByEmail = (email) =>
  new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
});

