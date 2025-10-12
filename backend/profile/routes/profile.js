export default async function profileRoute(fastify) {

	fastify.get('/profile', async (request, reply) => { 
		const { userName } = request.body ?? {}

		if (!userName) {
			return reply.code(400).send({ error: 'Username is required' })
		}
		
		try {
			const userProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName }
			})
			if (!userProfile) {
				return reply.code(404).send({ error: 'User not found' })
			}

			const [ userAchievementsProgress, userStats ] = await Promise.all([
				fastify.getAchievementProgress(userProfile),
				fastify.statCalculate(userProfile)
			])

			fastify.statCalculate(userProfile)

			return reply.send({
				profile: userProfile,
				achievements: userAchievementsProgress,
				stats: userStats
			})
		} catch (error) {
			fastify.log.error('Error retrieving user profile:', error)
			return reply.code(500).send({ error: 'Internal Server Error' })
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
		fastify.log.info('=== END DEBUG ===')

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

			const userProfile = await fastify.sequelize.models.Profile.create({ 
				userName: userName,
				email: email,
				userId: userId,
				displayName: userName // Default olarak username kullan
			})
			
			return reply.code(201).send({ 
				success: true, 
				message: 'Profile created successfully',
				profile: userProfile 
			})
		} catch (error) {
			fastify.log.error('Error creating user profile:', error)
			return reply.code(500).send({ error: 'Failed to create user profile' })
		}
	})
}
