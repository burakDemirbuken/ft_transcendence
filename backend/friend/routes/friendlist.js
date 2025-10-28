import { Op } from 'sequelize'

export default async function friendListRoutes(fastify) {
	fastify.get('/list', async (request, reply) => {
		const { userName } = request.query
		
		try {
			if (!userName) {
				throw new Error("userName is required.")
			}
			const friendships = await fastify.sequelize.models.Friend.findAll({
				where: {
					[Op.or]: [
						{ userName: userName},
						{ peerName: userName }
					]
				},
				attributes: ['userName', 'peerName', 'status'],
				raw: true
			})

			const [incomingPending, outgoingPending, accepted] = friendships.reduce((acc, friendship) => {
				const isUserInitiator = friendship.userName === userName
				if (friendship.status === 'pending') {
					if (isUserInitiator) {
						acc[1].push(friendship.peerName)
					} else {
						acc[0].push(friendship.userName)
					}
				} else if (friendship.status === 'accepted') {
					const friendName = isUserInitiator ? friendship.peerName : friendship.userName
					acc[2].push(friendName)
				}
				return acc
			}, [[], [], []])
			

			return reply.send({ 
				pendingFriends: {
					incoming: incomingPending,
					outcoming: outgoingPending
				},
				acceptedFriends: accepted
			})
		} catch (error) {
			fastify.log.error('Error retrieving user friends:', { message: error.message,
				details: error.toString() })
			return reply.code(500).send({message: 'Failed to retrieve friend list'})
		}
	})

	fastify.delete('/list', async (request, reply) => {
		const { userName } = request.body ?? {}

		try {
			if (!userName) {
				throw new Error('Username is required')
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
		} catch (error) {
			fastify.log.error('Error deleting friendships:', { message: error.message,
				details: error.toString() })
			return reply.code(500).send({ error: 'Failed to delete friendships' })
		}
	})
}
