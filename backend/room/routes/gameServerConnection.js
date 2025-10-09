// for gameserver websocket

export default async function gameServerConnectionSocket(fastify) {
	fastify.get("/ws/server", {
		websocket: true
	},
	(connection, req) => {
		const socket = connection.socket;
		connection.socket.on('message', (message) => {
			try
			{
				const data = JSON.parse(message.toString());
				fastify.roomManager.handleServerRoomMessage(data.type, data.payload);
			}
			catch (error) {
				console.error('❌ Failed to parse WebSocket message:', error);
				console.error('Raw message data:', message.toString());
			}

		})

		fastify.roomManager.on("create", async (data) => {
			socket.send(JSON.stringify({ type: 'create', payload: data }))
		})

	})
}
