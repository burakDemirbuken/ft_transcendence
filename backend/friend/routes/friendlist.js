import { Op } from 'sequelize'

export default async function friendListRoutes(fastify) {
	fastify.get('/list', async (request, reply) => {
		const { userName } = request.query
		if (!userName) {
			return reply.code(400).send({ error: 'Username is required' });
		}
		
		try {
			const friendships = await fastify.sequelize.models.Friend.findAll({
				where: {
					status: 'accepted',
					[Op.or]: [
						{ userName: userName },
						{ peerName: userName }
					],
				},
				attributes: ['userName', 'peerName']
			})

			const friendIds = [
				...new Set(friendships.map(f => 
					(f.userName === userName ? f.peerName : f.userName)).filter(Boolean))
			]

			if (friendIds.length === 0) { 
				return reply.code(200).send({ friends: [] })
			}
 
			const friendProfiles = await fetch('http://profile:3006/internal/friend', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ friends: friendIds }) //body kullanılımını desteklemeyebilir, querye koymak gerekebilir
			})
			if (!friendProfiles.ok) throw new Error('Network response was not ok')

			const data = await friendProfiles.json()
			const friends = Array.isArray(data?.users) ? data.users : []

			return reply.code(200).send({ friends })
		} catch (error) {
			fastify.log.error('Error retrieving user friends:', { message: error.message,
				details: error.toString() })
			return reply.code(500).send({
				error: 'Error retrieving user friends',
			})
		}
	})

	fastify.delete('/list', async (request, reply) => {
		const { userName } = request.body ?? {}

		if (!userName) {
			return reply.code(400).send({ error: 'Username is required' })
		}

		await fastify.sequelize.models.Friend.destroy({
			where: { 
				[Op.or]: [
					{ userName: userName },
					{ peerName: userName }
				]
			}
		})

		return reply.code(200).send({ message: 'All friendships deleted successfully' })
	})
}
