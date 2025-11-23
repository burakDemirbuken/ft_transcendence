import { Op } from 'sequelize'

export default async function friendListRoutes(fastify) {

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
