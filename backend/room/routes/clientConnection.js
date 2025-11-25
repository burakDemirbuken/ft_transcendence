import Player from '../models/Player.js';

export default async function clientConnectionSocket(fastify) {
/* 	setInterval(() => {
		console.log(`connected clients: ${fastify.websocketServer.clients.size}`);

	}, 1000); */
	fastify.get("/ws-room/client", {
		websocket: true
	},
	(connection, req) => {
		const userID = fastify.getDataFromToken(req)?.username ?? null;
		const currentPlayer = new Player(userID, connection.socket, req.query.userName || 'Anonymous');


		connection.socket.on('message', (message) => {
			let data;
			try {
				data = JSON.parse(message.toString());
				fastify.roomManager.handleClientRoomMessage(data.type, data.payload, currentPlayer)
			} catch (error) {
				currentPlayer.clientSocket.send(JSON.stringify({ type: 'error', payload: { message: error.message } }));
			}
		});

		connection.socket.on('close', () => {
			fastify.roomManager.leaveRoom(currentPlayer.id)
		});

		connection.socket.on('error', (error) => {
			fastify.log.error('WebSocket error:', error);
		});
	});
}
