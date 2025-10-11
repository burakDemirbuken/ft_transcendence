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

	fastify.delete('/profile', async (request, reply) => {
		const { userName } = request.body ?? {}

		if (!userName) {
			return reply.code(400).send({ error: 'userName is required' })
		}

		const deletedCount = await fastify.sequelize.models.Profile.destroy({
			where: { userName: userName }
		})

		if (deletedCount === 0) {
			return reply.code(404).send({ error: 'User not found' })
		}

		Promise.all([
			fetch('http://localhost:3007/list', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userName: userName })
			}),
			fetch('http://localhost:3001/auth/profile-delete', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userName: userName })
			})
		]).catch(err => { fastify.log.error('Error deleting user from other services:', err) })

		return { message: 'User deleted successfully' }
	})

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

	fastify.put('/profile', async (request, reply) => {
		const { userName } = request.body ?? {}

		if (!userName) {
			return reply.code(400).send({ error: 'Username is required' })
		}

		const userProfile = await fastify.sequelize.models.Profile.create({ userName: userName })
		
		if (!userProfile) {
			return reply.code(500).send({ error: 'Failed to create user profile' })
		}

		return reply.send({ profile: userProfile })
	})
}
