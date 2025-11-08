import { Op } from 'sequelize'
import fp from 'fastify-plugin'

export default fp(async function friendChanges(fastify) {

	async function getFriendList(userName) {
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
				throw new Error(`Failed to fetch friend profiles: ${friendsProfiles.status} ${await friendsProfiles.text()}`)
			}
			const { users } =  await friendsProfiles.json()

			const [incomingProfiles, outgoingProfiles, acceptedProfiles] = users.reduce((acc, profile) => {
				const baseProfile = {
					isOnline: fastify.presence.has(profile.userName),
					...profile
				}
				if (incomingPending.includes(profile.userName)) {
					acc[0].push(baseProfile)
				} else if (outgoingPending.includes(profile.userName)) {
					acc[1].push(baseProfile)
				} else if (accepted.includes(profile.userName)) {
					acc[2].push(baseProfile)
				}

				return acc
			}, [[], [], []])
			return ({
				pendingFriends: {
					incoming: incomingProfiles,
					outgoing: outgoingProfiles
				},
				acceptedFriends: acceptedProfiles
			})
		} catch (error) {
			fastify.log.error('Error retrieving user friends:', { message: error.message,
				details: error.toString() })
			return { message: 'Failed to retrieve user friends' }
		}
	}

	async function postSend(userName, peerName) {
		try {
			if (!userName || !peerName) {
				throw new Error("userName and peerName are required.")
			}
			if (userName === peerName) {
				return { user: "Can not send friend request to yourself.", peer: null }
			}
			const existingFriendship = await fastify.sequelize.models.Friend.findOne({
				where: {
					[Op.or]: [
						{ userName: userName, peerName: peerName },
						{ userName: peerName, peerName: userName }
					]
				}
			}) || null
			if (existingFriendship) {
				if (existingFriendship.status === 'pending') {
					return { user: "Friend request already pending.", peer: null }
				} else if (existingFriendship.status === 'accepted') {
					return { user: "Already friends.", peer: null }
				}
			}
			await fastify.sequelize.models.Friend.create({ userName, peerName, status: 'pending' })
			return { user: "Friend request sent.", peer: `${userName} has sent you a friend request.` }
		} catch (error) {
			fastify.log.error('Error sending friend request:', { message: error.message,
				details: error.toString() })
			return { user: 'Failed to send friend request', peer: null }
		}
	}

	async function postAccept(userName, peerName) {

		try {
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
					return { user: "Friend request already accepted.", peer: null }
				}
				friend.status = 'accepted'
				await friend.save()
				return { user: "Friend request accepted.", peer: `${userName} has accepted your friend request.` }
			} else {
				return { user: "Friend request not found.", peer: null }
			}
		} catch (error) {
			fastify.log.error('Error accepting friend request:', { message: error.message,
				details: error.toString() })
			return { user: 'Failed to accept friend request', peer: null }
		}
	}

	async function postReject(userName, peerName) {

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
					return { user: "No pending friend request to reject.", peer: null }
				}
				await fastify.sequelize.models.Friend.destroy({
					where: {
						[Op.or]: [
							{ userName: peerName, peerName: userName },
							{ userName: userName, peerName: peerName }
						]
					}
				})
				return { user: "Friend request rejected.", peer: `${userName} has rejected your friend request.` }
			} else {
				return { user: "Friend request not found.", peer: null }
			}
		} catch (error) {
			fastify.log.error('Error rejecting friend request:', { message: error.message,
				details: error.toString() })
			return { message: 'Failed to reject friend request' }
		}
	}

	async function postRemove(userName, peerName) {

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
				return { user: "Friend removed successfully.", peer: `${userName} has removed you from their friends list.` }
			} else {
				return { user: "Friend not found.", peer: null }
			}
		} catch (error) {
			fastify.log.error('Error removing friend:', { message: error.message,
				details: error.toString() })
			return { user: 'Failed to remove friend', peer: null }
		}
	}

	fastify.decorate('getFriendList', getFriendList)
	fastify.decorate('postRemove', postRemove)
	fastify.decorate('postReject', postReject)
	fastify.decorate('postAccept', postAccept)
	fastify.decorate('postSend', postSend)
})
