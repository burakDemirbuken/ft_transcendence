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

			const friendProfiles = await fetch('http://profile:3006/internal/friend', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ friends: friendIds }) //body kullanılımını desteklemeyebilir, querye koymak gerekebilir
			})
			if (!friendProfiles.ok) throw new Error('Network response was not ok')

			const data = await friendProfiles.json()

			return reply.code(200).send({ friends: data })
		} catch (error) {
			fastify.log.error('Error fetching friend list:', error)
			return reply.status(500).send({ error: 'Internal Server Error' })
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
