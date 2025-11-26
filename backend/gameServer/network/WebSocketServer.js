import websocket from '@fastify/websocket'
import Fastify from 'fastify';
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import getDataFromToken from '../utils/token.js';
class NetworkManager
{
	constructor(logger = false)
	{
		// JWT secret must be set in .env
		if (!process.env.JWT_SECRET) {
			throw new Error('JWT_SECRET environment variable is required! Please set it in .env file');
		}

		if (process.env.JWT_SECRET.length < 32) {
			console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security!');
		}

		this.fastify = Fastify({ logger: false

		});
		this.fastify.register(cookie);
		this.fastify.register(jwt, { secret: process.env.JWT_SECRET });

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
						const dataFromToken = getDataFromToken(req, fastify);
						if (!dataFromToken)
						{
							console.error('❌ Unauthorized WebSocket connection attempt. Closing connection.');
							client.close(1008, 'Unauthorized');
							return;
						}
						const client = connection.socket;
						const connectionId = this._generateConnectionId();
						this.connections.set(connectionId, client);
						onConnect(connectionId, dataFromToken.username, req.query);

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
