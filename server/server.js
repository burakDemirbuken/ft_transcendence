// ...existing code...
const fastify = require('fastify')({
	logger: true});
const websocket = require('@fastify/websocket');

fastify.register(websocket);

const clients = new Set();

fastify.get('/ws', { websocket: true }, (connection, req) => {
	console.log('✅ Yeni client bağlandı');
	clients.add(connection.socket);

	connection.socket.on('message', message => {
		console.log('📨 Gelen mesaj:', message.toString());

		// Tüm bağlı client'lara yay
		for (const client of clients) {
			if (client !== connection.socket) {
				client.send(message.toString());
			}
		}
	});

	connection.socket.on('close', () => {
		console.log('❌ Client ayrıldı');
		clients.delete(connection.socket);
	});
});

const start = async () =>
{
	fastify.listen({ port: 3000 }, err => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log('🚀 WebSocket sunucusu http://localhost:3000/ws üzerinde çalışıyor');
	});
};

start();
