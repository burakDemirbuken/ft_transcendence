// for gameserver websocket
export default async function gameServerConnectionSocket(fastify) {
	fastify.get("/ws-room/server", { // "ws-room/server" olabilir
		websocket: true
	},
	(connection, req) => {
		const socket = connection.socket;
		fastify.roomManager.isConnectServer = true;
		connection.socket.on('close', () => {
			fastify.roomManager.isConnectServer = false;
		});
		connection.socket.on('message', (message) => {
			try
			{
				const data = JSON.parse(message.toString());
				fastify.roomManager.handleServerRoomMessage(data.type, data.payload);
			}
			catch (error)
			{
				fastify.log.error('❌ Failed to parse WebSocket message:', error);
				fastify.log.error('Raw message data:', message.toString());
			}

		})

		fastify.roomManager.on("create", async (data) => {
			socket.send(JSON.stringify({ type: 'create', payload: data }))
		})

	})
}

