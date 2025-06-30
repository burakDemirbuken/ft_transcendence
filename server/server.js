import Fastify from 'fastify'
import websocket from '@fastify/websocket'

const fastify = Fastify({ logger: true });

// WebSocket plugin'ini kaydet
await fastify.register(websocket);

const clients = new Set();

// WebSocket route'u
fastify.register(
	async function (fastify)
	{
		fastify.get('/ws', { websocket: true },
			(connection, req) =>
			{
				console.log('🟢 Yeni WebSocket bağlantısı kuruldu');  // ← Bu log'u görmeli

				clients.add(connection.socket);

				connection.socket.on('message',
					message =>
					{
						console.log('📨 Gelen mesaj:', message.toString());

						// Tüm bağlı client'lara yay
						for (const client of clients)
							client.send(message.toString());
					});

				connection.socket.on('close',
					() =>
					{
						clients.delete(connection.socket);
						console.log('Client disconnected');
					})
			});
	});

// Normal HTTP route'ları da ekleyebilirsiniz
fastify.get('/burak',
	async (request, reply) =>
	{
		return "naber";
	});

async function start()
{
	try
	{
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
		console.log('Server listening on port 3000');
		console.log('WebSocket: ws://localhost:3000/ws');
	}
	catch (err)
	{
		fastify.log.error(err);
		process.exit(1);
	}
}

start();
