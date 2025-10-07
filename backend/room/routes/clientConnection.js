// for frontend websocket
import Player from '../models/Player.js';

export default async function clientConnectionSocket(fastify) {
	fastify.get("/ws-room/client", {
		websocket: true
	},
	(connection, req) => {
		if (req.query.userID === undefined) {
			connection.socket.close(1008, 'userID query parameter is required');
			return;
		}
		const currentPlayer = new Player(req.query.userID, connection.socket, 'Anonymous');
/*		console.log('New client connected', {
			ip: req.ip,
			protocol: connection.socket.protocol,
			readystate: connection.socket.readyState,
			remote:  connection.socket._socket.remoteAddress + ':' + connection.socket._socket.remotePort
		});*/

		connection.socket.on('message', (message) => {
			console.log('Received message from client:', message.toString());
			let data;

			try {
				data = JSON.parse(message.toString());
				fastify.roomManager.handleRoomMessage(data.type, data.payload, currentPlayer)
			} catch (error) {
				currentPlayer.clientSocket.send(JSON.stringify({ type: 'error', payload: { message: error.message } }));
			}
		})

		connection.socket.on('close', () => {

			fastify.roomManager.leaveRoom(currentPlayer)
			fastify.log.error('Client disconnected')
		});

		connection.socket.on('error', (error) => {
			fastify.log.error('WebSocket error:', error);
		});
	});
}
