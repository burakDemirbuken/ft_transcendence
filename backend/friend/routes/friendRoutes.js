export default async function friendRoutes(fastify) {
	const presence = new Map()

	fastify.get("/ws-friend/friends", { websocket: true }, async (socket, req) => {
		// cookie'den gelicek
		const { userName } = req.query
		console.log('New presence connection:', userName)

		if (!userName) {
			socket.close(1008, "Missing parameter: userName")
			return
		}

		const state = { lastseen: Date.now(), socket: socket }
		presence.set(userName, state)

		socket.on('message', async (message) => {
			const { type, payload } = JSON.parse(message)
			const { peerName } = payload.peerName || {}
			const result = {}

			switch (type) {
				case "send":
					result = fastify.postSend(userName, peerName)
					break
				case "accept":
					result = fastify.postAccept(userName, peerName)
					break
				case "remove":
					result = fastify.postRemove(userName, peerName)
					break
				case "reject":
					result = fastify.postReject(userName, peerName)
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
					break
				default:
					fastify.log.warn({ userName, type }, 'Unknown presence message type')
					break
			}

			const userResult = await fastify.getFriendList(userName)
			socket.send(JSON.stringify({
				type: 'response',
				payload: {
					friendlist: userResult,
					message: result.user
				}
			}))

			if (result.peer && presence.has(peerName)) {
				const peerResult = await fastify.getFriendList(peerName)
				presence.get(peerName).socket.send(JSON.stringify({
					type: 'response',
					payload: {
						friendlist: peerResult,
						message: result.peer
					}
				}))
			}
		})

		const cleanup = async (situation) => {
			presence.delete(userName)
			fastify.log.info({ userName, situation })
		}

		socket.on('close', () => cleanup('closed'))
		socket.on('error', (err) => cleanup(err))
	})

	fastify.decorate('presence', presence)
}
