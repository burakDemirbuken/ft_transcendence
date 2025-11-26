import Player from '../models/Player.js';

const connections = [];

export default async function clientConnectionSocket(fastify) {

	fastify.get("/ws-room/client", {
		websocket: true
	},
	(connection, req) => {
		const userID = fastify.getDataFromToken(req)?.username ?? null;
		if (!userID) {
			fastify.log.error('❌ Unauthorized WebSocket connection attempt. Closing connection.');
			connection.socket.close(1008, 'Unauthorized');
			return;
		}
		if (connections.includes(userID))
		{
			fastify.error(`❌ User ${userID} is already in a room. Closing connection.`);
			connection.socket.close(1008, 'Already in room');
			return;
		}
		connections.push(userID);
		const currentPlayer = new Player(userID, connection.socket, req.query.userName || 'Anonymous');
		fastify.log.info(`✅ User ${userID} connected via WebSocket.`);
		fastify.log.info(`Player info: ID=${currentPlayer.id}, Name=${currentPlayer.name}`);

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
			const index = connections.indexOf(userID);
			if (index > -1) {
				connections.splice(index, 1);
			}
		});

		connection.socket.on('error', (error) => {
			fastify.log.error('WebSocket error:', error);
			fastify.roomManager.leaveRoom(currentPlayer.id);
			const index = connections.indexOf(userID);
			if (index > -1) {
				connections.splice(index, 1);
			}
		});
	});
}
