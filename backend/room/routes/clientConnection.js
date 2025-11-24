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
		console.log('New client connected', {
			ip: req.ip,
			protocol: connection.socket.protocol,
			readystate: connection.socket.readyState,
			remote:  connection.socket._socket.remoteAddress + ':' + connection.socket._socket.remotePort
		});

		connection.socket.on('message', (message) => {
			console.log('Received message from client:', message.toString());
			let data;

			try {
				data = JSON.parse(message.toString());
				fastify.roomManager.handleClientRoomMessage(data.type, data.payload, currentPlayer)
			} catch (error) {
				currentPlayer.clientSocket.send(JSON.stringify({ type: 'error', payload: { message: error.message } }));
			}
		});

		connection.socket.on('close', () => {
			console.log('Client disconnected', {
				ip: req.ip,
				protocol: connection.socket.protocol,
				readystate: connection.socket.readyState,
				remote:  connection.socket._socket.remoteAddress + ':' + connection.socket._socket.remotePort
			});
			fastify.roomManager.leaveRoom(currentPlayer.id)
			fastify.log.error('Client disconnected')
		});

		connection.socket.on('error', (error) => {
			fastify.log.error('WebSocket error:', error);
		});
	});
}
