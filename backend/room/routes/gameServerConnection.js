// for gameserver websocket

export default async function gameServerConnectionSocket(fastify) {
	fastify.get("/ws/server", { // "ws-room/server" olabilir
		websocket: true
	},
	(connection, req) => {
		const socket = connection.socket;
		connection.socket.on('message', (message) => {
			if (!userID) {
				connection.socket.close(1008, 'userID query parameter is required')
				return;
			}
			
		})

		fastify.roomManager.on("roomStart", async (data) => {
			socket.send(JSON.stringify({ type: 'roomStart', payload: data }))
		})

		socket.send(JSON.stringify({ type: 'connection', payload: 'Connected to game server' }))
	})
}
