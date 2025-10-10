// for frontend websocket

export default async function clientConnectionSocket(fastify) {
	fastify.get("/ws/client", {
		websocket: true
	},
	(connection, req) => {
		const client = connection.socket;

		console.log('New client connected', {
			ip: req.ip,
			protocol: client.protocol,
			readystate: client.readyState,
			remote:  client._socket.remoteAddress + ':' + client._socket.remotePort
		});

		client.on('message', (message) => {
			
		});

		client.on('close', () => {
			
			console.log('Client disconnected');
		});

		client.on('error', (error) => {
			console.error('WebSocket error:', error);
		});
	});
}
