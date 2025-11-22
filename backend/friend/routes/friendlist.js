import { Op } from 'sequelize'

export default async function friendListRoutes(fastify) {

	fastify.delete('/internal/list', async (request, reply) => {
		const userName = request.body?.userName ?? null;

		try {
			if (!userName) {
				throw new Error('Username is required')
			}

			const friendships = await fastify.sequelize.models.Friend.findAll({
				where: {
					[Op.or]: [
						{ userName: userName },
						{ peerName: userName }
					]
				},
				attributes: ['userName', 'peerName'],
				raw: true
			})

			const friendsToNotify = friendships.map(f => f.userName === userName ? f.peerName : f.userName)

			await fastify.presence.get(userName)?.socket.close()

			await fastify.sequelize.models.Friend.destroy({
				where: {
					[Op.or]: [
						{ userName: userName },
						{ peerName: userName }
					]
				}
			})

			if (friendsToNotify.length > 0) {
				await Promise.allSettled(friendsToNotify.map(async (friendName) => {
					if (fastify.presence.has(friendName)) {
						const friendList = await fastify.getFriendList(friendName)
						const userConnection = fastify.presence.get(friendName)
						if (userConnection?.socket?.readyState === 1) {
							userConnection.socket.send(JSON.stringify({
								type: 'list',
								payload: {
									friendlist: friendList
								}
							}))
						}
					}
				}))
			}


			return reply.code(200).send({ message: 'All friendships deleted successfully' })
		} catch (error) {
			fastify.log.error(`Error deleting friendships: ${error.message}`)
			return reply.code(500).send({ error: 'Failed to delete friendships' })
		}
	})

	fastify.post('/internal/notify', async (request, reply) => {
		const { userName } = request.body ?? {}

		try {
			if (!userName) {
				throw new Error('Username is required')
			}

			await fastify.notifyFriendChanges(userName)	
			console.log(`Notified friends of ${userName} about status change.`)
			return reply.code(200).send({ message: 'Friends notified successfully' })
		} catch (error) {
			fastify.log.error(`Error notifying friend changes: ${error.message}`)

			return reply.code(500).send({ error: 'Failed to notify friend changes' })
		} 
	})
}
