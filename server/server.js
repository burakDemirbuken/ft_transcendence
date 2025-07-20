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

async function start()
{
	try
	{
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
		console.log('Server listening on port 3000');
		console.log('WebSocket: ws://127.0.0.1:3000/ws');
	}
	catch (err)
	{
		fastify.log.error(err);
		process.exit(1);
	}
}

const tickRate = 30; // 30 FPS
const tickInterval = 1000 / tickRate; // ~33ms
let y = 0;
setInterval(() =>
{
	for (const client of clients)
	{

		const exampleGameState =
		{
			currentState: 'waiting', // 'waiting', 'playing', 'finished'
			gameData:
			{
				players:
				[
					{
						id: 'player1',
						name: 'Player 1',
						position:
						{
							x: 20,
							y: 412 - y
						}
					},
					{
						id: 'player2',
						name: 'Player 2',
						position:
						{
							x: 482,
							y: y
						}
					}
				],
				ball:
				{
					position:
					{
						x: 512 / 2,
						y: 512 / 2
					},
					radius: 10,
					speed: 5
				},
				score: { player1: 0, player2: 0 },
			}
		}
		client.send(JSON.stringify({
			type: 'stateChange',
			payload: exampleGameState
		}));
	}
}, tickInterval);

let a;
setInterval(() =>
{
	if (y >= 412)
		a = -1;
	else if (y <= 0)
		a = 1;
	y += a * 7;
}, tickInterval);

start();

//
