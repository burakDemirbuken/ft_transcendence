import { Op } from 'sequelize'

export default async function friendChangeRoutes(fastify) {
	fastify.post('/send', async (request, reply) => {
		const { userName, peerName } = request.body 

		try {
			if (!userName || !peerName) {
				throw new Error("userName and peerName are required.")
			}

			if (userName === peerName) {
				return reply.status(400).send({ error: "Can not send friend request to yourself." })
			}

			const existingFriendship = await fastify.sequelize.models.Friend.findOne({
				where: {
					[Op.or]: [
						{ userName: userName, peerName: peerName },
						{ userName: peerName, peerName: userName }
					]
				}
			})

			if (existingFriendship) {
				if (existingFriendship.status === 'pending') {
					return reply.status(400).send({ error: "Friend request already pending." })
				} else if (existingFriendship.status === 'accepted') {
					return reply.status(400).send({ error: "Already friends." })
				}
			}

			await fastify.sequelize.models.Friend.create({ userName, peerName, status: 'pending' })
			return reply.status(201).send( { message: "Friend request sent." } )
		} catch (error) {
			fastify.log.error('Error sending friend request:', { message: error.message,
				details: error.toString() })
			return reply.status(500).send({ error: 'Failed to send friend request' })
		}
	})

	fastify.post('/accept', async (request, reply) => {
		const { userName, peerName } = request.body
		
		try {
			const { userName, peerName } = request.body
			if (!userName || !peerName) {
				throw new Error("userName and peerName are required.")
			}

			const friend = await fastify.sequelize.models.Friend.findOne({
				where: {
					[Op.or]: [
						{ userName: peerName, peerName: userName },
						{ userName: userName, peerName: peerName }
					]
				}
			})

			if (friend) {
				if (friend.status === 'accepted') {
					return reply.status(400).send({ success: false, error: "Friend request already accepted." })
				}
				friend.status = 'accepted'
				await friend.save()
				return reply.status(200).send( {message: "Friend request accepted."} )
			} else {
				return reply.status(404).send( {message: "Friend request not found."} )
			}
		} catch (error) {
			fastify.log.error('Error accepting friend request:', { message: error.message,
				details: error.toString() })
			return reply.status(500).send({ error: 'Failed to accept friend request' })
		}
	})
	
	fastify.post('/reject', async (request, reply) => {
		const { userName, peerName } = request.body
	
		try {
			if (!userName || !peerName) {
				throw new Error("userName and peerName are required.")
			}
			
			const pendingRequest = await fastify.sequelize.models.Friend.findOne({
				where: {
					[Op.or]: [
						{ userName: peerName, peerName: userName },
						{ userName: userName, peerName: peerName }
					]
				}
			})
			if (pendingRequest) {
				if (pendingRequest.status !== 'pending') {
					return reply.status(400).send({ error: "No pending friend request to reject." })
				}
				await fastify.sequelize.models.Friend.destroy({
					where: {
						[Op.or]: [
							{ userName: peerName, peerName: userName },
							{ userName: userName, peerName: peerName }
						]
					}
				})
				return reply.status(200).send({ message: "Friend request rejected." })
			} else {
				return reply.status(404).send({ message: "Friend request not found." })
			}
		} catch (error) {
			fastify.log.error('Error rejecting friend request:', { message: error.message,
				details: error.toString() })
			return reply.status(500).send({ error: 'Failed to reject friend request' })
		}
	})

	fastify.post('/remove', async (request, reply) => {
		const { userName, peerName } = request.body
	
		try {
			if (!userName || !peerName) {
				throw new Error("userName and peerName are required.")
			}

			const deletedCount = await fastify.sequelize.models.Friend.destroy({
				where: {
					[Op.or]: [
						{ userName: userName, peerName: peerName },
						{ userName: peerName, peerName: userName }
					]
				}
			})

			if (deletedCount) {
				return reply.status(200).send( {message: "Friend removed."} )
			} else {
				return reply.status(404).send( {message: "Friend not found."} )
			}
		} catch (error) {
			fastify.log.error('Error removing friend:', { message: error.message,
				details: error.toString() })
			return reply.status(500).send({ error: 'Failed to remove friend' })
		}
	})

}
