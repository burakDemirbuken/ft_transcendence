import sqlite3 from 'sqlite3';
sqlite3.verbose();

const DBSOURCE = './data/db.sqlite';

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err.message);
    throw err;
  }

  console.log('✅ SQLite veritabanına bağlanıldı.');

  // USERS tablosu
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `, (err) => {
    if (err) console.error('❌ users tablosu:', err.message);
    else console.log('📦 users tablosu hazır.');
  });

  // REFRESH TOKENS tablosu (sadece refresh token'lar için)
  db.run(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      token_type TEXT NOT NULL DEFAULT 'refresh',
      ip_address TEXT,
      user_agent TEXT,
      expires_at INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('❌ tokens tablosu:', err.message);
    else console.log('📦 tokens tablosu hazır.');
  });
});

export default db;
