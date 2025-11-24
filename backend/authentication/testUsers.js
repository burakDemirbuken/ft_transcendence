import User from './models/User.js';
import { testConnection } from './models/database.js';

const TEST_USERS = [
    { username: 'testuser1',  email: 'testuser1@test.com',  password: 'qweqweqwe' },
    { username: 'testuser2',  email: 'testuser2@test.com',  password: 'qweqweqwe' },
    { username: 'testuser3',  email: 'testuser3@test.com',  password: 'qweqweqwe' },
    { username: 'testuser4',  email: 'testuser4@test.com',  password: 'qweqweqwe' },
    { username: 'testuser5',  email: 'testuser5@test.com',  password: 'qweqweqwe' },
    { username: 'testuser6',  email: 'testuser6@test.com',  password: 'qweqweqwe' },
    { username: 'testuser7',  email: 'testuser7@test.com',  password: 'qweqweqwe' },
    { username: 'testuser8',  email: 'testuser8@test.com',  password: 'qweqweqwe' },
    { username: 'testuser9',  email: 'testuser9@test.com',  password: 'qweqweqwe' },
    { username: 'testuser10', email: 'testuser10@test.com', password: 'qweqweqwe' },
    { username: 'testuser11', email: 'testuser11@test.com', password: 'qweqweqwe' },
    { username: 'testuser12', email: 'testuser12@test.com', password: 'qweqweqwe' },
    { username: 'testuser13', email: 'testuser13@test.com', password: 'qweqweqwe' },
    { username: 'testuser14', email: 'testuser14@test.com', password: 'qweqweqwe' },
    { username: 'testuser15', email: 'testuser15@test.com', password: 'qweqweqwe' },
    { username: 'testuser16', email: 'testuser16@test.com', password: 'qweqweqwe' },
    { username: 'testuser17', email: 'testuser17@test.com', password: 'qweqweqwe' },
    { username: 'testuser18', email: 'testuser18@test.com', password: 'qweqweqwe' },
    { username: 'testuser19', email: 'testuser19@test.com', password: 'qweqweqwe' },
    { username: 'testuser20', email: 'testuser20@test.com', password: 'qweqweqwe' },
];

async function createTestUsers() {
    try {
        await testConnection();
        console.log('🔧 Creating/checking test users...');

        let created = 0;
        let existing = 0;

        for (const userData of TEST_USERS) {
            try {
                const existingUser = await User.findByEmail(userData.email) || await User.findByUsername(userData.username);

                if (!existingUser) {
                    const newUser = await User.create({
                        username: userData.username,
                        email: userData.email.toLowerCase(),
                        password: userData.password,
                        is_active: true // Test kullanıcıları aktif
                    });

                    try {
                        await fetch('http://profile:3006/internal/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userName: newUser.username,
                            })
                        });
                    } catch (profileError) {
                        console.log(`Profile service error for ${userData.username}:`, profileError.message);
                    }

                    console.log(`✅ Created test user: ${userData.username}`);
                    created++;
                } else {
                    existing++;
                }
            } catch (userError) {
                console.log(`❌ Error creating user ${userData.username}:`, userError.message);
            }
        }

        console.log(`🎉 Test users ready: ${created} created, ${existing} already existed`);
        console.log('📝 Test credentials: username/password123 (e.g., testuser1/password123)');

    } catch (error) {
        console.log('❌ Test user creation failed:', error.message);
    }
}

export { createTestUsers, TEST_USERS };
