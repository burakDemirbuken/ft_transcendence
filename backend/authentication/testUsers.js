import User from './models/User.js';
import { testConnection } from './models/database.js';

const TEST_USERS = [
    { username: 'testuser1', email: 'testuser1@test.com', password: 'password123' },
    { username: 'testuser2', email: 'testuser2@test.com', password: 'password123' },
    { username: 'testuser3', email: 'testuser3@test.com', password: 'password123' },
    { username: 'alice', email: 'alice@test.com', password: 'password123' },
    { username: 'bob', email: 'bob@test.com', password: 'password123' },
    { username: 'charlie', email: 'charlie@test.com', password: 'password123' },
    { username: 'diana', email: 'diana@test.com', password: 'password123' },
    { username: 'eve', email: 'eve@test.com', password: 'password123' },
    { username: 'frank', email: 'frank@test.com', password: 'password123' },
    { username: 'grace', email: 'grace@test.com', password: 'password123' }
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
                        await fetch('http://profile:3006/create', {
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
