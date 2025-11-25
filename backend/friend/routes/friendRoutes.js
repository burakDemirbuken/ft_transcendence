export default async function friendRoutes(fastify) {
	const presence = fastify.presence

	fastify.get("/ws-friend/friends", { websocket: true }, async (socket, req) => {
		const userName  = (await fastify.getDataFromToken(req))?.username ?? null
		if (!userName) {
			console.error('Missing userName in presence connection')
			socket.close(1008, "Missing parameter: userName")
			return
		}

		const state = { lastseen: Date.now(), socket: socket }
		presence.set(userName, state)
		fastify.notifyFriendChanges(userName)

		socket.on('message', async (message) => {
			const { type, payload } = JSON.parse(message)
			const peerName = payload?.peerName
			let result = {}

			switch (type) {
				case "send":
					result = await fastify.postSend(userName, peerName)
					break
				case "accept":
					result = await fastify.postAccept(userName, peerName)
					break
				case "remove":
					result = await fastify.postRemove(userName, peerName)
					break
				case "reject":
					result = await fastify.postReject(userName, peerName)
					break
				case "list":
					const userResult = await fastify.getFriendList(userName)

					return socket.send(JSON.stringify({
						type: 'list',
						payload: {
							friendlist: userResult,
							message: userResult.message || null
						}
					}))
				default:
					fastify.log.warn({ userName, type }, 'Unknown presence message type')
					break
			}

			const userResult = await fastify.getFriendList(userName)
			socket.send(JSON.stringify({
				type: 'list',
				payload: {
					friendlist: userResult,
					message: result.user
				}
			}))

			if (result.peer && presence.has(peerName)) {
				const peerResult = await fastify.getFriendList(peerName)
				presence.get(peerName).socket.send(JSON.stringify({
					type: 'list',
					payload: {
						friendlist: peerResult,
						message: result.peer
					}
				}))
			}
		})

		const cleanup = async (situation) => {
			if (!(await presence.delete(userName)))
				return
			await fastify.notifyFriendChanges(userName)
			fastify.log.info({ userName, situation })
		}

		socket.on('close', () => cleanup('closed'))
		socket.on('error', (err) => cleanup(err))
	})
}
