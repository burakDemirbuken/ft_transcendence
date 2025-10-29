import { Op } from 'sequelize'

export default async function profileRoute(fastify) {

	fastify.get('/profile', async (request, reply) => {
		const { userName } = request.query ?? {}
		
		try {
			if (!userName) {
				throw new Error('userName is required')
			}
			
			const userProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName },
				attributes: ['id', 'userName', 'displayName', 'avatarUrl']
			})

			if (!userProfile && userProfile === undefined) {
				return reply.code(404).send({ message: `User not found: ${userName}` })
			}
			const [ userAchievementsProgress, userStats ] = await Promise.all([
				fastify.getAchievementProgress(userProfile.id),
				fastify.statCalculate(userProfile.id)
			])
			return reply.send({
				profile: userProfile.toJSON(),
				achievements: userAchievementsProgress,
				stats: userStats
			})
		} catch (error) {
			fastify.log.error('Error retrieving user profile:', { message: error.message,
				details: error.toString() })
			return reply.code(500).send({ message: 'Error retrieving user profile' })
		}
	})

	fastify.delete('/profile', async (request, reply) => {
		const { userName } = request.body ?? {}

		//?
		const isFromAuthService = request.headers['x-auth-service'];

		if (!isFromAuthService) {
			return reply.code(403).send({
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

			Promise.all([
				fetch('http://friend:3007/list', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userName: userName })
				}).catch(err => fastify.log.error('Error deleting from friend service:', err))
			])

			return reply.code(200).send({
				success: true,
				message: 'Profile deleted successfully'
			})
		} catch (error) {
			fastify.log.error('Error deleting profile:', error)
			return reply.code(500).send({ error: 'Failed to delete profile' })
		}
	})

	fastify.delete('/profile-delete-by-username', async (request, reply) => {
		const { userName } = request.body ?? {}

		try {
			if (!userName) {
				throw new Error('userName is required')
			}

			const deletedCount = await fastify.sequelize.models.Profile.destroy({
				where: { userName: userName }
			})

			if (deletedCount === 0) {
				return reply.code(404).send({ error: 'User not found' })
			}

			return reply.code(200).send({
				success: true,
				message: 'Profile deleted successfully',
			})
		} catch (error) {
			fastify.log.error('Error deleting profile by username:', error)
			return reply.code(500).send({ message: 'Failed to delete profile' })
		}
	})

	fastify.post('/displaynameupdate', async (request, reply) => {
		const { userName , dname } = request.body ?? {}

		
		try {
			if (!userName) {
				throw new Error('userName is required')
			}

			const userProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName }
			})

			userProfile.displayName = dname ?? userProfile.displayName
			await userProfile.save()

			return reply.code(200).send({
				message: 'Display name updated successfully',
				profile: userProfile.displayName
			})

		} catch (error) {
			fastify.log.error('Error updating display name:', error)
			return reply.code(500).send({ message: 'Failed to update display name' })
		}
	})

	fastify.post('/create', async (request, reply) =>
	{
		const { userName } = request.body ?? {}

		
		try {
			if (!userName) {
				throw new Error('userName is required')
			}
	
			const existingProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName }
			})
	
			if (existingProfile) {
				return reply.code(409).send({ error: 'Profile already exists' })
			}
			const t = await fastify.sequelize.transaction();

			const userProfile = await fastify.sequelize.models.Profile.create({
				userName: userName,
				displayName: userName
			}, { transaction: t })

			await Promise.all([
				userProfile.createStat({}, {transaction: t}),
				userProfile.createAchievement({}, {transaction: t})
			])

			await t.commit()
			return reply.code(201).send({
				success: true,
				message: 'Profile created successfully',
				profile: userProfile
			})
		} catch (error) {
			t.rollback();
			fastify.log.error({
				msg: 'Error creating user profile',
				name: error?.name,
				message: error?.message,
				errors: error?.errors,
				parent: error?.parent,
				sql: error?.sql,
			})
			return reply.code(500).send({ message: 'Failed to create user profile' })
		}
	})

	fastify.post('/internal/friend', async (request, reply) => {
		const { friends } = request.body ?? {}
		try {		
			if (!friends || !Array.isArray(friends) || friends.length === 0) {
				throw new Error('Friends array is required')
			}

			const userProfiles = await fastify.sequelize.models.Profile.findAll({
				where: {
					userName: {
						[Op.in]: friends
					}
				},
				attributes: ['userName', 'displayName', 'avatarUrl']
			})
			if (!userProfiles) {
				return reply.code(404).send({ message: 'Users not found' })
			}

			return reply.code(200).send({
				success: true,
				users: userProfiles.map(profile => profile.toJSON())
			})
		} catch (error) {
			fastify.log.error('Error retrieving friends profiles:', { message: error.message,
				details: error.toString() })
			return reply.code(500).send({ message: 'Failed to retrieve friends profiles' })
		}
	})

	fastify.post('/internal/avatar-update', async (request, reply) => {
		const {userName, filename, avatarUrlPath } = request.body ?? {}
		
		try {
			if (!userName || !filename || !avatarUrlPath) {
				throw new Error('userName, filename, and avatarUrlPath are required')
			}

			const userProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName }
			})

			if (!userProfile) {
				return reply.code(404).send({ error: 'User not found' })
			}

			userProfile.avatarUrl = avatarUrlPath
			await userProfile.save()

			return reply.code(200).send({
				success: true,
				message: 'Avatar updated successfully'
			})
		} catch (error) {
			fastify.log.error('Error updating avatar:', { message: error.message,
				details: error.toString() })
			return reply.code(500).send({ message: 'Failed to update avatar' })
		}
	})
}

