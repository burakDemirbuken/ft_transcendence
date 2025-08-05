import sql from 'sqlite3'
import {Sequelize, DataTypes} from 'sequelize'

const db = new sql.Database('database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err)
  } else {
    console.log('Database opened successfully')
  }
})

const seq = new Sequelize({
	dialect: 'sqlite',
	storage: 'database.db',
	
	logging: console.log,
	
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000
	},
	
	query: {
		nest: true,
		type: 'SELECT | INSERT | UPDATE | DELETE | UPSERT | SHOWTABLES | DESCRIBE | RAW',
	},
	
	dialectOptions: {
		timeout: 20000,
		pragma: {
			journal_mode: 'WAL',
			synchronous: 'NORMAL',
			cache_size: -64000,
			temp_store: 'MEMORY',
			foreign_keys: true,
			busy_timeout: 30000,
			wal_autocheckpoint: 1000
		}
	},
	
	benchmark: false,
	
	retry: {
		match: [
			/SQLITE_BUSY/,
			/SQLITE_LOCKED/,
			/database is locked/,
			/ETIMEDOUT/,
			/ECONNRESET/
		],
		max: 5
	},
	
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
	}
})

const testUser = seq.define('testUser', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  uniqueID: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV1,
    allowNull: false,
    unique: true
  }
})

// Veritabanı test fonksiyonları
async function testDatabase() {
	try {
		console.log('🔄 Veritabanı testi başlıyor...');
		
		// 1. Bağlantı testi
		await seq.authenticate();
		console.log('✅ Sequelize bağlantısı başarılı');
		
		// 2. Tablo oluşturma testi
		await seq.sync({ force: true });
		console.log('✅ Tablolar başarıyla oluşturuldu');
		
		// 3. Veri ekleme testi
		const user1 = await testUser.create({
			name: 'John Doe',
			email: 'john@example.com'
		});
		console.log('✅ Kullanıcı eklendi:', user1.toJSON());
		
		// 4. Birden fazla veri ekleme
		const users = await testUser.bulkCreate([
			{ name: 'Jane Smith', email: 'jane@example.com' },
			{ name: 'Bob Wilson', email: 'bob@example.com' },
			{ name: 'Alice Brown', email: 'alice@example.com' }
		]);
		console.log('✅ Toplu kullanıcı eklendi:', users.length, 'adet');
		
		// 5. Veri çekme testleri
		const allUsers = await testUser.findAll();
		console.log('✅ Tüm kullanıcılar:', allUsers.length, 'adet');
		
		const oneUser = await testUser.findOne({ where: { email: 'john@example.com' } });
		console.log('✅ Tek kullanıcı bulundu:', oneUser?.name);
		
		// 6. Veri güncelleme testi
		await testUser.update(
			{ name: 'John Updated' },
			{ where: { email: 'john@example.com' } }
		);
		console.log('✅ Kullanıcı güncellendi');
		
		// 7. Ham SQL sorgu testi
		const results = await seq.query('SELECT COUNT(*) as total FROM testUsers', { 
			type: seq.QueryTypes.SELECT 
		});
		console.log('✅ Ham SQL sorgusu:', results);
		
		// 8. Transaction testi
		const transaction = await seq.transaction();
		try {
			await testUser.create({
				name: 'Transaction Test',
				email: 'transaction@example.com'
			}, { transaction });
			
			await transaction.commit();
			console.log('✅ Transaction başarılı');
		} catch (error) {
			await transaction.rollback();
			console.log('❌ Transaction geri alındı:', error.message);
		}
		
		// 9. Performans testi
		console.time('⏱️ 100 kayıt ekleme süresi');
		const bulkData = Array.from({ length: 100 }, (_, i) => ({
			name: `User ${i}`,
			email: `user${i}@example.com`
		}));
		await testUser.bulkCreate(bulkData);
		console.timeEnd('⏱️ 100 kayıt ekleme süresi');
		
		// 10. Final durumu
		const finalCount = await testUser.count();
		console.log('✅ Final kullanıcı sayısı:', finalCount);
		
		console.log('🎉 Tüm testler başarıyla tamamlandı!');
		
	} catch (error) {
		console.error('❌ Test hatası:', error);
	}
}

// Veritabanı temizleme fonksiyonu
async function cleanDatabase() {
	try {
		await testUser.drop();
		console.log('🧹 Testler temizlendi');
	} catch (error) {
		console.error('❌ Temizleme hatası:', error);
	}
}

// Detaylı bağlantı bilgisi fonksiyonu
async function showDatabaseInfo() {
	try {
		console.log('📊 Veritabanı Bilgileri:');
		console.log('- Dialect:', seq.getDialect());
		console.log('- Database:', seq.config.database || 'database.db');
		console.log('- Storage:', seq.options.storage || seq.config.storage);
		
		// PRAGMA bilgileri
		const pragmaResults = await seq.query('PRAGMA database_list', { 
			type: seq.QueryTypes.SELECT 
		});
		console.log('- PRAGMA database_list:', pragmaResults);
		
		const journalMode = await seq.query('PRAGMA journal_mode', { 
			type: seq.QueryTypes.SELECT 
		});
		console.log('- Journal Mode:', journalMode);
		
		const foreignKeys = await seq.query('PRAGMA foreign_keys', { 
			type: seq.QueryTypes.SELECT 
		});
		console.log('- Foreign Keys:', foreignKeys);
		
	} catch (error) {
		console.error('❌ Info hatası:', error);
	}
}

// Test menüsü
async function runTests() {
	console.log('🚀 SQLite Veritabanı Test Paketi');
	console.log('================================');
	
	await showDatabaseInfo();
	console.log('');
	
	await testDatabase();
	console.log('');
	
	// Uncomment to clean up after tests
	// await cleanDatabase();
	
	process.exit(0);
}

// Test'i çalıştır
runTests();

