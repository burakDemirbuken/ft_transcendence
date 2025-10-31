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

			const allFriendNames = [...incomingPending, ...outgoingPending, ...accepted]

			const friendsProfiles = await fetch("http://profile:3006/internal/friend", {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ friends: allFriendNames })
			})

			if (!friendsProfiles.ok) {
				fastify.log.error(`Failed to fetch friend profiles: ${friendsProfiles.status}`)
				return reply.code(500).send({ message: 'Failed to retrieve friend profiles' })
			}

			const {users} =  await friendsProfiles.json()

			const [incomingProfiles, outgoingProfiles, acceptedProfiles] = users.reduce((acc, profile) => {
				if (incomingPending.includes(profile.userName)) {
					acc[0].push(profile)
				} else if (outgoingPending.includes(profile.userName)) {
					acc[1].push(profile)
				} else if (accepted.includes(profile.userName)) {
					acc[2].push(profile)
				}
				return acc
			}, [[], [], []])
			console.log('pending incoming:', incomingProfiles)
			console.log('pending outgoing:', outgoingProfiles)
			console.log('accepted:', acceptedProfiles)
			return reply.send({
				pendingFriends: {
					incoming: incomingProfiles,
					outcoming: outgoingProfiles
				},
				acceptedFriends: acceptedProfiles
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
