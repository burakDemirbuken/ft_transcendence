import { Op } from 'sequelize'

export default async function profileRoute(fastify) {

	fastify.get('/profile', async (request, reply) => {
		const userName = request.query?.userName ?? (await fastify.getDataFromToken(request))?.username ?? null

		try {
			if (!userName) {
				return reply.code(400).send({ message: 'userName is required' })
			}

			const userProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName },
				include: [
					{
						model: fastify.sequelize.models.Stat,
						attributes: {
							exclude: ['id', 'userId', 'createdAt', 'updatedAt']
						}
					},
					{
						model: fastify.sequelize.models.Achievement,
						attributes: {
							exclude: ['id', 'userId', 'createdAt', 'updatedAt']
						}
					}],
				attributes: ['id', 'userName', 'displayName', 'avatarUrl']
			})

			const profileData = userProfile?.toJSON() ?? null
			if (!profileData) {
				return reply.code(404).send({ message: `User not found: ${userName}` })
			}

			const [ userAchievementsProgress, userStats ] = await Promise.all([
				fastify.getAchievementProgress(profileData.Achievement),
				fastify.statCalculate(userProfile.id, profileData)
			])
			delete profileData.id

			return reply.send({
				profile: profileData,
				achievements: userAchievementsProgress,
				stats: userStats
			})
		} catch (error) {
			fastify.log.error(`Error retrieving user profile: ${error.message}`)
			return reply.code(500).send({ message: 'Error retrieving user profile' })
		}
	})

	fastify.post('/displaynameupdate', async (request, reply) => {
		const userName = (await fastify.getDataFromToken(request))?.username ?? null
		const dname = request.body?.dname ?? null

		try {
			if (!userName) {
				console.error('userName is missing in token')
				return reply.code(400).send({ message: 'userName is required' })
			}

			if (!dname) {
				console.error('Display name is missing in request body')
				return reply.code(400).send({ message: 'Display name is required' })
			}

			const userProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName }
			})

			if (!userProfile) {
				console.error('User not found for userName:', userName)
				return reply.code(404).send({ message: 'User not found' })
			}

			const existingProfile = await fastify.sequelize.models.Profile.findOne({
				where: {
					displayName: dname,
					userName: {
						[Op.ne]: userName
					}
				}
			})

			if (existingProfile) {
				console.log('Display name already taken:', dname)
				return reply.code(409).send({ message: 'Display name is already taken' })
			}

			userProfile.displayName = dname
			await userProfile.save()

			fetch('http://friend:3007/internal/notify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userName: userName })
			}).catch(err => fastify.log.error(`Error notifying friend service of display name change: ${err.message}`))

			return reply.code(200).send({
				message: 'Display name updated successfully',
				profile: userProfile.displayName
			})

		} catch (error) {
			fastify.log.error(`Error updating display name: ${error.message}`)
			return reply.code(500).send({ message: 'Failed to update display name' })
		}
	})

	fastify.delete('/internal/profile', async (request, reply) => {
		const userName = request.body?.userName ?? null;

		const isFromAuthService = request.headers['x-auth-service'];

		if (!isFromAuthService) {
			return reply.code(403).send({
				error: 'Profile deletion must be done through authentication service',
				redirectTo: '/api/auth/profile'
			});
		}

		if (!userName) {
			return reply.code(400).send({ message: 'userName is required' })
		}

		try {
			const deletedCount = await fastify.sequelize.models.Profile.destroy({
				where: { userName: userName }
			})

			if (deletedCount === 0) {
				return reply.code(404).send({ message: 'User not found' })
			}

			return reply.code(204).send()
		} catch (error) {
			fastify.log.error(`Error deleting profile: ${error.message}`)
			return reply.code(500).send({ message: 'Failed to delete profile' })
		}
	})

	fastify.post('/internal/create', async (request, reply) =>
	{
		const { userName } = request.body ?? {}
		let t;

		try {
			if (!userName) {
				return reply.code(400).send({ message: 'userName is required' })
			}

			const existingProfile = await fastify.sequelize.models.Profile.findOne({
				where: {
					[Op.or]: [
						{ userName: userName },
						{ displayName: userName }
					]
				}
			})

			if (existingProfile) {
				if (existingProfile.userName === userName) {
					return reply.code(409).send({ error: 'Profile already exists' })
				} else {
					return reply.code(409).send({ error: 'Display name is already taken' })
				}
			}

			t = await fastify.sequelize.transaction();

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
			if (t)
				await t.rollback()

			fastify.log.error({
				msg: 'Error creating user profile',
				message: error?.message,
			})

			return reply.code(500).send({ message: 'Failed to create user profile' })
		}
	})

	fastify.post('/internal/friend', async (request, reply) => {
		const { friends } = request.body ?? {}

		try {
			if (!friends || !Array.isArray(friends) || friends.length === 0) {
				return reply.code(400).send({ message: 'Friends array is required' })
			}

			const userProfiles = await fastify.sequelize.models.Profile.findAll({
				where: {
					userName: {
						[Op.in]: friends
					}
				},
				attributes: ['userName', 'displayName', 'avatarUrl']
			})

			if (!userProfiles || userProfiles.length === 0) {
				return reply.code(404).send({ message: 'Users not found' })
			}

			return reply.code(200).send({ users: userProfiles.map(profile => profile.toJSON()) })
		} catch (error) {
			fastify.log.error(`Error retrieving friends profiles: ${error.message}`)
			return reply.code(500).send({ message: 'Failed to retrieve friends profiles' })
		}
	})

	fastify.post('/internal/avatar-update', async (request, reply) => {
		const { userName, avatarUrlPath } = request.body ?? {}

		try {
			if (!userName || !avatarUrlPath) {
				return reply.code(400).send({ message: 'userName and avatarUrlPath are required' })
			}

			const userProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName }
			})

			if (!userProfile) {
				return reply.code(404).send({ message: 'User not found' })
			}

			userProfile.avatarUrl = avatarUrlPath
			await userProfile.save()

			fetch('http://friend:3007/internal/notify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userName: userName })
			}).catch(err => fastify.log.error('Error notifying friend service of avatar change:', err))

			return reply.code(200).send({  message: 'Avatar updated successfully', newAvatarUrl: userProfile.avatarUrl  })
		} catch (error) {
			fastify.log.error(`Error updating avatar: ${error.message}`)
			return reply.code(500).send({ message: 'Failed to update avatar' })
		}
	})

	fastify.post('/internal/exists', async (request, reply) => {
		const { userName } = request.body ?? {}

		try {
			if (!userName) {
				return reply.code(400).send({ message: 'userName is required' })
			}

			const userProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName },
				attributes: ['userName']
			})

			if (userProfile == null) {
				return reply.code(404).send({ exists: false, message: 'User not found' })
			}

			return reply.code(200).send({ exists: true, message: 'User exists' })
		} catch (error) {
			fastify.log.error(`Error checking user existence: ${error.message}`)
			return reply.code(500).send({ message: 'Error checking user existence' })
		}
	})
}
