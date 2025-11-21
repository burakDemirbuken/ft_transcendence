import { Op } from 'sequelize'

export default async function friendListRoutes(fastify) {

	fastify.delete('/internal/list', async (request, reply) => {
		const userName = request.body?.userName ?? null;

		try {
			if (!userName) {
				throw new Error('Username is required')
			}

			const deletedUserFriends = await fastify.getFriendList(userName)

			await fastify.presence.get(userName)?.socket.close()

			await fastify.sequelize.models.Friend.destroy({
				where: {
					[Op.or]: [
						{ userName: userName },
						{ peerName: userName }
					]
				}
			})

			if (deletedUserFriends && (deletedUserFriends.pendingFriends || deletedUserFriends.acceptedFriends)) {
				const friendsToNotify = [
					...(deletedUserFriends.pendingFriends?.incoming || []),
					...(deletedUserFriends.pendingFriends?.outgoing || []),
					...(deletedUserFriends.acceptedFriends || [])
				]

				await Promise.allSettled(friendsToNotify.map(async (friend) => {
					if (fastify.presence.has(friend.userName)) {
						const friendList = await fastify.getFriendList(friend.userName)
						const userConnection = fastify.presence.get(friend.userName)
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
			fastify.log.error('Error deleting friendships:', { message: error.message })
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
			fastify.log.error('Error notifying friend changes:', { message: error.message })

			return reply.code(500).send({ error: 'Failed to notify friend changes' })
		} 
	})
}
