// for frontend websocket
import Player from '../models/Player.js';

export default async function clientConnectionSocket(fastify) {
	
	// Test endpoint - Nginx proxy test için
	fastify.get("/test", {
		websocket: true
	},
	(connection, req) => {
		console.log('✅ Test WebSocket connection established via nginx!');
		
		connection.socket.on('message', (message) => {
			console.log('📨 Received test message:', message.toString());
			connection.socket.send(JSON.stringify({ 
				type: 'test-response', 
				message: 'Hello from Room service via Nginx!',
				receivedAt: new Date().toISOString()
			}));
		});

		connection.socket.on('close', () => {
			console.log('🔌 Test WebSocket disconnected');
		});

		connection.socket.on('error', (error) => {
			console.error('❌ Test WebSocket error:', error);
		});

		// Bağlantı kurulduğunda hoş geldin mesajı gönder
		connection.socket.send(JSON.stringify({ 
			type: 'welcome', 
			message: 'Connected to Room service test endpoint via Nginx!',
			timestamp: new Date().toISOString()
		}));
	});
	
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
