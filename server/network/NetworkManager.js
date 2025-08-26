import websocket from '@fastify/websocket'
import Fastify from 'fastify';

class NetworkManager
{
	constructor(logger = false)
	{
		this.fastify = Fastify({ logger: logger});
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

		const { onClientConnect, onMessage, onClose, onError } = this.callbacks;

		if (!onClientConnect || !onMessage || !onClose || !onError
				|| typeof onClientConnect !== 'function' || typeof onMessage !== 'function' || typeof onClose !== 'function' || typeof onError !== 'function')
		{
			throw new Error('WebSocket callbacks not properly set');
		}
		await this.fastify.register(websocket);

		await this.fastify.register(
			async function(fastify)
			{
				fastify.get('/ws', { websocket: true },
					(connection, req) =>
					{
						const client = connection.socket;
						const connectionId = this._generateConnectionId();
						console.log('🟢 New WebSocket connection:', connectionId, req.query);
						this.connections.set(connectionId, client);
						onConnect(connectionId, req.query);

						client.on('message', (message) => onMessage(connectionId, message));

						client.on('close',
							() =>
							{
								console.log('🔴 WebSocket connection closed:', connectionId);
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
		this.callbacks.onMessage = callback;
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

	stop()
	{
		this.fastify.close();
		this.connections.clear();
		this.callbacks.clear();
	}

	broadcast(message)
	{
		const data = typeof message === 'string' ? message : JSON.stringify(message);
		this.connections.forEach(
			(client) =>
			{
				if (client.readyState === 1)
				{
					try
					{
						client.send(data);
					}
					catch (error)
					{
						console.error('❌ Error sending message to client:', error);
						this.connections.delete(client);
					}
				}
			}
		);
	}

	send(connectionId, message)
	{
		const client = this.connections.get(connectionId);
		if (!client)
			throw new Error(`No client found with connectionId: ${connectionId}`);
		if (client.readyState === 1)
		{
			if (typeof message !== 'string')
				throw new Error('Message must be a string');
			client.send(message);
		}
	}

	getConnectionCount()
	{
		return this.connections.size;
	}
}

export default NetworkManager;
