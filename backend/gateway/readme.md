import sql from 'sqlite3'
import {Sequelize, DataTypes} from 'sequelize'

const db = new sql.Database('database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err)
  } else {
    console.log('Database opened successfully')
  }
})

const seq = new Sequelize('database.db', null, null, {
	// ========== TEMEL AYARLAR ==========
	dialect: 'sqlite',
	storage: 'database.db',
	
	// ========== LOGLAMA AYARLARI ==========
	logging: console.log,
	
	// ========== BAĞLANTI HAVUZU ==========
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000
	},
	
	// ========== TIMEZONE ==========
	timezone: 'local', // '+HH:MM' | '-HH:MM' | 'local' | 'UTC'
	
	// ========== MODEL VARSAYILANLARI ==========
	define: {
		timestamps: true, // createdAt ve updatedAt otomatik ekler
		paranoid: false, // Soft delete için deletedAt ekler
		underscored: false, // snake_case isimlendirme (false = camelCase)
		freezeTableName: false, // Tablo isimlerini çoğul yapmaz
		createdAt: 'createdAt', // createdAt alan ismi
		updatedAt: 'updatedAt', // updatedAt alan ismi
		deletedAt: 'deletedAt', // deletedAt alan ismi (paranoid: true ise)
		version: false, // Versiyon kontrolü
		comment: '', // Tablo açıklaması
		indexes: [] // Otomatik index tanımları
	},
	
	// ========== QUERY AYARLARI ==========
	// Bu ayarlar sequelize.query() fonksiyonu için varsayılan davranışları belirler
	query: {
		// RAW - Ham SQL sonuçları
		raw: false, 
		// false: Sequelize model instance'ları döndürür (User.findAll() gibi)
		// true: Ham JavaScript objeleri döndürür (daha hızlı, ama Sequelize özellikleri yok)
		// Örnek:
		// raw: false -> [User { id: 1, name: 'John', save: function... }]  
		// raw: true  -> [{ id: 1, name: 'John' }]
		
		// NEST - İç içe objeler oluşturma
		nest: true,
		// false: Düz objeler döndürür { 'user.name': 'John', 'user.email': 'john@example.com' }
		// true: İç içe objeler oluşturur { user: { name: 'John', email: 'john@example.com' } }
		// JOIN'li sorgularda çok kullanışlı
		// Örnek JOIN sorgusu:
		// nest: false -> { 'User.name': 'John', 'Profile.age': 25 }
		// nest: true  -> { User: { name: 'John' }, Profile: { age: 25 } }
		
		// PLAIN - Tek sonuç döndürme
		plain: false,
		// false: Array döndürür [obj1, obj2, obj3] (çoklu sonuçlar için)
		// true: Tek obje döndürür obj1 (findOne gibi davranır)
		// Sadece ilk sonucu alır, diğerlerini yok sayar
		// Örnek:
		// plain: false -> [{ id: 1 }, { id: 2 }, { id: 3 }]
		// plain: true  -> { id: 1 }
		
		// TYPE - Query tipi belirleme
		type: 'SELECT | INSERT | UPDATE | DELETE | UPSERT | SHOWTABLES | DESCRIBE | RAW',
	},
	
	// ========== GÜVENLİK ==========
	operatorsAliases: false, // Operatör aliaslarını devre dışı (önerilen)
	
	// ========== SQLITE ÖZELLİKLERİ ==========
	dialectOptions: {
		timeout: 20000, // SQLite timeout (ms)
		
		// SQLite PRAGMA ayarları (performans ve davranış)
		pragma: {
			journal_mode: 'WAL', // Seçenekler: 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'WAL' | 'OFF'
			synchronous: 'NORMAL', // Seçenekler: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA'
			cache_size: -64000, // Negatif = KB, pozitif = sayfa sayısı (-64000 = 64MB)
			temp_store: 'MEMORY', // Seçenekler: 'DEFAULT' | 'FILE' | 'MEMORY'
			foreign_keys: true, // Foreign key kontrolü
			busy_timeout: 30000, // Busy timeout (ms)
			wal_autocheckpoint: 1000 // WAL checkpoint interval
		}
	},
	
	// ========== PERFORMANS ==========
	benchmark: true, // Query sürelerini ölçer ve loglar
	
	// ========== HATA YÖNETİMİ ==========
	retry: {
		match: [
			/SQLITE_BUSY/, // SQLite veritabanı meşgul
			/SQLITE_LOCKED/, // SQLite veritabanı kilitli
			/database is locked/, // Veritabanı kilitli hatası
			/ETIMEDOUT/,
			/ECONNRESET/
		],
		max: 5 // Maksimum retry sayısı
	},
	
	// ========== SYNC AYARLARI ==========
	sync: {
		force: false, // true = Tabloları siler ve yeniden oluşturur (VERİ KAYBI!)
		alter: false, // true = Mevcut tabloları günceller
		logging: console.log // Sync işlemleri için log
	},
	
	// ========== TRANSACTION AYARLARI ==========
	transactionType: 'DEFERRED', // SQLite transaction tipi: 'DEFERRED' | 'IMMEDIATE' | 'EXCLUSIVE'
	
	// ========== HOOK'LAR (Olay Dinleyiciler) ==========
	hooks: {
		beforeConnect: (config) => {
			console.log('SQLite veritabanına bağlanılıyor...');
		},
		afterConnect: (connection, config) => {
			console.log('SQLite veritabanına başarıyla bağlanıldı');
		},
		beforeDisconnect: (connection) => {
			console.log('SQLite bağlantısı kesiliyor...');
		}
	},
	
	// ========== DİĞER AYARLAR ==========
	validateOnly: false, // true = Sadece validasyon, bağlantı kurma
	minifyAliases: false, // Alias'ları kısaltır
	logQueryParameters: false // Query parametrelerini loglar
})

