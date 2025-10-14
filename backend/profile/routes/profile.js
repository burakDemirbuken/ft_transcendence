export default async function profileRoute(fastify) {

	fastify.get('/profile', async (request, reply) => { 
		const { userName } = request.query;
		if (!userName) {
			return reply.code(400).send({ error: 'Username is required' })
		}
		
		try {
			// Veritabanındaki tüm kullanıcıları listele (debug için)
			const allUsers = await fastify.sequelize.models.Profile.findAll({
				attributes: ['userName', 'id'],
				limit: 10
			});
			console.log('📊 Database users:', allUsers.map(u => u.userName));
			console.log('🔎 Searching for userName:', userName);
			
			const userProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName }
			})
			
			if (!userProfile) {
				console.log('❌ User not found in database');
				return reply.code(404).send({ 
					error: 'User not found',
					searchedFor: userName,
					availableUsers: allUsers.map(u => u.userName)
				})
			}
			
			console.log('✅ User found:', userProfile.userName);

			// Stats ve Achievement kayıtlarının varlığını kontrol et, yoksa oluştur
			const { Stats, Achievement } = fastify.sequelize.models;
			
			let [userStatsRecord, userAchievementRecord] = await Promise.all([
				Stats.findOne({ where: { userId: userProfile.id } }),
				Achievement.findOne({ where: { userId: userProfile.id } })
			]);

			// Stats yoksa oluştur
			if (!userStatsRecord) {
				console.log('⚠️ Stats record not found, creating...');
				userStatsRecord = await Stats.create({
					userId: userProfile.id,
					gamesPlayed: 0,
					gamesWon: 0,
					gamesLost: 0,
					xp: 0,
					gameCurrentStreak: 0,
					gameLongestStreak: 0,
					gameTotalDuration: 0,
					gameMinDuration: 999999999,
					ballHitCount: 0,
					ballMissCount: 0
				});
				console.log('✅ Stats record created');
			}

			// Achievement yoksa oluştur
			if (!userAchievementRecord) {
				console.log('⚠️ Achievement record not found, creating...');
				userAchievementRecord = await Achievement.create({
					userId: userProfile.id,
					firstWin: null,
					hundredWins: null,
					fiveHundredWins: null,
					firstTenStreak: null,
					twentyFiveTenStreak: null,
					lessThanThreeMin: null
				});
				console.log('✅ Achievement record created');
			}

			console.log('🔧 Calling getAchievementProgress...');
			const userAchievementsProgress = await fastify.getAchievementProgress(userProfile);
			console.log('✅ Achievement progress retrieved');
			
			console.log('🔧 Calling statCalculate...');
			const userStats = await fastify.statCalculate(userProfile);
			console.log('✅ Stats calculated');

			return reply.send({
				profile: userProfile,
				achievements: userAchievementsProgress,
				stats: userStats
			})
		} catch (error) {
			console.error('❌ FULL ERROR:', error);
			console.error('❌ ERROR STACK:', error.stack);
			console.error('❌ ERROR MESSAGE:', error.message);
			fastify.log.error('Error retrieving user profile:', error)
			return reply.code(500).send({ 
				error: 'Internal Server Error',
				message: error.message,
				details: error.toString()
			})
		}
	})

	// Profile deletion - Only accepts requests from auth service
	fastify.delete('/profile', async (request, reply) => {
		console.log('Delete request body:', request.body)
		const { userName } = request.body ?? {}

		// Bu endpoint sadece auth service'ten gelen istekleri kabul eder
		const isFromAuthService = request.headers['x-auth-service'];
		
		if (!isFromAuthService) {
			fastify.log.warn('❌ Direct profile deletion not allowed. Use auth service.');
			return reply.code(403).send({ 
				success: false,
				error: 'Profile deletion must be done through authentication service',
				redirectTo: '/api/auth/profile'
			});
		}

		if (!userName) {
			return reply.code(400).send({ error: 'userName is required' })
		}

		try {
			const deletedCount = await fastify.sequelize.models.Profile.destroy({
				where: { userName: userName }
			})

			if (deletedCount === 0) {
				return reply.code(404).send({ error: 'User not found' })
			}

			// Sadece friend service'ten sil (auth service zaten çağırıyor)
			Promise.all([
				fetch('http://friend:3007/list', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userName: userName })
				}).catch(err => fastify.log.error('Error deleting from friend service:', err))
			]);

			fastify.log.info('✅ Profile deleted successfully for user:', userName);
			
			return reply.code(200).send({ 
				success: true,
				message: 'Profile deleted successfully' 
			})
		} catch (error) {
			fastify.log.error('Error deleting profile:', error)
			return reply.code(500).send({ error: 'Failed to delete profile' })
		}
	})

	// User-friendly delete endpoint (redirects to auth service)
	fastify.delete('/delete-account', async (request, reply) => {
		return reply.code(302).send({
			success: false,
			error: 'Account deletion must be done through authentication service',
			redirectTo: '/api/auth/profile',
			message: 'Please use DELETE /api/auth/profile endpoint for account deletion'
		});
	})

	// Delete profile by username (for auth service to call)
	fastify.delete('/profile-delete-by-username', async (request, reply) => {
		const { userName } = request.body ?? {}

		fastify.log.info('Delete request body:', request.body)
		fastify.log.info('Delete userName:', userName)

		if (!userName) {
			return reply.code(400).send({ error: 'userName is required' })
		}

		try {
			const deletedCount = await fastify.sequelize.models.Profile.destroy({
				where: { userName: userName }
			})

			if (deletedCount === 0) {
				return reply.code(404).send({ error: 'User not found' })
			}

			return reply.code(200).send({ 
				success: true,
				message: 'Profile deleted successfully',
				deletedCount: deletedCount
			})
		} catch (error) {
			fastify.log.error('Error deleting profile by username:', error)
			return reply.code(500).send({ error: 'Failed to delete profile' })
		}
	})

	// Update profile
	fastify.put('/profile', async (request, reply) => {
		const { UserName, displayName, bio, avatarUrl } = request.body ?? {}

		if (!UserName) {
			return reply.code(400).send({ error: 'Username is required' })
		}

		const userProfile = await fastify.sequelize.models.Profile.findOne({
			where: { userName: UserName }
		})

		if (!userProfile) {
			return reply.code(404).send({ error: 'User not found' })
		}

		userProfile.bio = bio ?? userProfile.bio
		userProfile.avatarUrl = avatarUrl ?? userProfile.avatarUrl
		userProfile.displayName = displayName ?? userProfile.displayName

		await userProfile.save()

		return reply.code(200).send({ message: 'Profile updated successfully' })
	})

	// Create new user profile
	fastify.post('/create', async (request, reply) =>
	{
	// Manual body parsing attempt if body is undefined
 		if (!request.body && request.headers['content-type'] === 'application/json') {
			fastify.log.info('Body is undefined, trying manual parsing...')
			// This shouldn't be necessary but let's see
		}
		const { userName, email, userId } = request.body ?? {}

		fastify.log.info('Parsed data:', { userName, email, userId })

		if (!userName) {
			fastify.log.error('Username missing from request')
			return reply.code(400).send({ error: 'Username is required' })
		}

		try {
			// Check if profile already exists
			const existingProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName }
			})

			if (existingProfile) {
				return reply.code(409).send({ error: 'Profile already exists' })
			}

			// Transaction kullanarak profile, stats ve achievements'ı birlikte oluştur
			const t = await fastify.sequelize.transaction();
			
			try {
				const userProfile = await fastify.sequelize.models.Profile.create({ 
					userName: userName,
					email: email,
					userId: userId,
					displayName: userName // Default olarak username kullan
				}, { transaction: t })
				
				// Stats kaydı oluştur
				await fastify.sequelize.models.Stats.create({
					userId: userProfile.id,
					gamesPlayed: 0,
					gamesWon: 0,
					gamesLost: 0,
					xp: 0,
					gameCurrentStreak: 0,
					gameLongestStreak: 0,
					gameTotalDuration: 0,
					gameMinDuration: 999999999,
					ballHitCount: 0,
					ballMissCount: 0
				}, { transaction: t })
				
				// Achievement kaydı oluştur
				await fastify.sequelize.models.Achievement.create({
					userId: userProfile.id,
					firstWin: null,
					hundredWins: null,
					fiveHundredWins: null,
					firstTenStreak: null,
					twentyFiveTenStreak: null,
					lessThanThreeMin: null
				}, { transaction: t })
				
				await t.commit()
				
				fastify.log.info('✅ Profile, Stats and Achievements created for user:', userName)
				
				return reply.code(201).send({ 
					success: true, 
					message: 'Profile created successfully',
					profile: userProfile 
				})
			} catch (error) {
				await t.rollback()
				throw error
			}
		} catch (error) {
			fastify.log.error('Error creating user profile:', error)
			return reply.code(500).send({ error: 'Failed to create user profile' })
		}
	})
}
