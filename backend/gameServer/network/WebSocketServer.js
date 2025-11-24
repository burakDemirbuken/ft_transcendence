import websocket from '@fastify/websocket'
import Fastify from 'fastify';
import { getDataFromToken } from '../../plugins/utils.js';
class NetworkManager
{
	constructor(logger = false)
	{
		this.fastify = Fastify({ logger: logger});
		this.fastify.addHook('onRequest', async (request) => {
			console.log(`--> ${request.method} ${request.url}`);
		});
		this.connections = new Map(); // connectionId -> WebSocket

		this.callbacks = {
			onConnect : null,
			onMessage: null,
			onClose: null,
			onError: null
		};
	}

	async start(config = { host: '0.0.0.0', port: 3000 })
	{
		if (this.fastify.server.listening)
			throw new Error('WebSocket server already started');

		const { onConnect, onMessage, onClose, onError } = this.callbacks;

		if (!onConnect || !onMessage || !onClose || !onError
				|| typeof onConnect !== 'function' || typeof onMessage !== 'function' || typeof onClose !== 'function' || typeof onError !== 'function')
		{
			throw new Error('WebSocket callbacks not properly set');
		}
		await this.fastify.register(websocket);

		await this.fastify.register(
			async function(fastify)
			{
				fastify.get('/ws-game', { websocket: true },
					(connection, req) =>
					{
						const client = connection.socket;
						const connectionId = this._generateConnectionId();
						this.connections.set(connectionId, client);
						onConnect(connectionId, (getDataFromToken(req)?.username ?? null), req.query);

						client.on('message', (message) =>
							{
								try
								{
									const messageString = message.toString();
									const parsedMessage = JSON.parse(messageString);
									onMessage(connectionId, parsedMessage);
								}
								catch (error)
								{
									console.error('❌ Error parsing message:', error);
									console.log('Raw message:', message);
								}
							});

						client.on('close',
							() =>
							{
								this.connections.delete(connectionId);
								onClose(connectionId);
							}
						);

						client.on('error',
							(error) =>
							{
								console.error('❌ WebSocket error:', error);
								this.connections.delete(connectionId);
								onError(connectionId, error);
							}
						);
					}
				);
			}.bind(this)
		);

		try
		{
			await this.fastify.listen({ port: config.port, host: config.host });
			console.log(`🚀 WebSocket server started on ws://${config.host}:${config.port}`);
		}
		catch (error)
		{
			console.error('❌ Error starting WebSocket server:', error);
			throw error;
		}
	}

	_generateConnectionId()
	{
		return `conn-${Math.random().toString(36).substring(2, 15)}`;
	}

	onClientConnect(callback)
	{
		this.callbacks.onConnect = callback;
	}

	onMessage(callback)
	{
		this.callbacks.onMessage= callback;
	}

	onClose(callback)
	{
		this.callbacks.onClose = callback;
	}

	onError(callback)
	{
		this.callbacks.onError = callback;
	}

	disconnectConnection(connectionId)
	{
		const client = this.connections.get(connectionId);
		if (client)
		{
			client.close();
			this.connections.delete(connectionId);
		}
	}

	send(connectionId, message)
	{
		const client = this.connections.get(connectionId);
		if (!client)
			throw new Error(`No client found with connectionId: ${connectionId}`);
		if (client.readyState === 1)
			client.send(JSON.stringify(message));
	}

	getConnectionCount()
	{
		return this.connections.size;
	}
}

export default NetworkManager;
