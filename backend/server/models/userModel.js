const db = require('../config/db');

const createUserTable = () => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
};


const createUser = (username, email, hashedPassword, callback) => {
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.run(sql, [username, email, hashedPassword], function (err) {
    callback(err, this?.lastID);
  });
};

const getAllUsers = (callback) => {
  db.all('SELECT id, username, email, created_at FROM users', [], callback);
};

const getUserByUsername = (username, callback) => {
  db.get('SELECT * FROM users WHERE username = ?', [username], callback);
};

module.exports = {
  createUserTable,
  createUser,
  getAllUsers,
  getUserByUsername
};
