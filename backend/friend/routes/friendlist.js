import { Op } from 'sequelize'

export default async function friendListRoutes(fastify) {

	fastify.delete('/internal/list', async (request, reply) => {
		const userName = request.body?.userName ?? null

		if (!userName) {
			return reply.code(400).send({ message: 'Username is required' })
		}

		try {
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

			if (!Array.isArray(friendships) || friendships.length === 0) {
				return reply.code(404).send({ message: 'No friendships found for user' })
			}

			const friendsToNotify = friendships.map(f => f.userName === userName ? f.peerName : f.userName)

			await fastify.sequelize.models.Friend.destroy({
				where: {
					[Op.or]: [
						{ userName: userName },
						{ peerName: userName }
					]
				}
			})

			if (friendsToNotify.length > 0) {
				const res = await Promise.allSettled(friendsToNotify.map(async (friendName) => {
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
				
				const failedNotifications = res.filter(r => r.status === 'rejected')
				if (failedNotifications.length > 0) {
					fastify.log.error(`Failed to notify some friends of ${userName} about friendship deletion.`)
				}
			}

			const userConnection = fastify.presence.get(userName)
			if (userConnection) {
				fastify.presence.delete(userName)
				await userConnection.socket.close()
			}

			return reply.code(200).send({ message: 'All friendships deleted successfully' })
		} catch (error) {
			fastify.log.error(`Error deleting friendships: ${error.message}`)
			return reply.code(500).send({ message: 'Failed to delete friendships' })
		}
	})

	fastify.post('/internal/notify', async (request, reply) => {
		const { userName } = request.body ?? {}

		if (!userName) {
			return reply.code(400).send({ message: 'Username is required' })
		}

		try {
			await fastify.notifyFriendChanges(userName)
			fastify.log.info(`Notified friends of ${userName} about status change.`)
			return reply.code(200).send({ message: 'Friends notified successfully' })
		} catch (error) {
			fastify.log.error(`Error notifying friend changes: ${error.message}`)
			return reply.code(500).send({ message: 'Failed to notify friend changes' })
		}
	})
}
