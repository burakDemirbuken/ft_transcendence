import sqlite3 from 'sqlite3';
sqlite3.verbose();

const DBSOURCE = './data/db.sqlite';

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error('DB bağlantı hatası:', err.message);
    throw err;
  } else {
    console.log('✅ SQLite veritabanına bağlanıldı.');

    // Tablonun kendisi
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        twofa_code TEXT,
        twofa_expires INTEGER
      )`,
      (err) => {
        if (err) {
          console.error('❌ Tablo oluşturulamadı:', err.message);
        } else {
          console.log('📦 users tablosu hazır.');
        }

        // 🔄 Yeni sütunlar var mı diye kontrol et, yoksa ekle
        db.get("PRAGMA table_info(users)", (err, row) => {
          if (err) return console.error(err.message);

          const alterQueries = [
            `ALTER TABLE users ADD COLUMN rememberMe INTEGER DEFAULT 0`,
            `ALTER TABLE users ADD COLUMN twoFactorEnabled INTEGER DEFAULT 0`
          ];

          alterQueries.forEach((query) => {
            db.run(query, (err) => {
              if (err && !err.message.includes('duplicate column')) {
                console.error('🔧 Sütun ekleme hatası:', err.message);
              }
            });
          });
        });
      }
    );
  }
});

export default db;