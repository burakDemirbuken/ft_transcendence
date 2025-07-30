import websocket from '@fastify/websocket'

class WebSocketManager
{
	constructor(fastify ,config = {port: 3000})
	{
		this.wss = null;
		this.clients = new Map(); // playerId -> WebSocket
		this.config = config;
		this.fastify = fastify;
	}

	async start(onClientConnect, onMessage, onClose)
	{
		await this.fastify.register(websocket);

		await this.fastify.register(
			async function(fastify)
			{
				fastify.get('/ws', { websocket: true },
					(connection, req) =>
					{
						console.log('🟢 Yeni WebSocket bağlantısı kuruldu');

						const client = connection.socket;

						const { id, name } = req.query;
						if (!id)
						{
						    console.warn('⚠️ User bilgisi eksik, connection kapatılıyor');
						    connection.socket.close(1008, 'User info required');
						    return;
						}

						if (this.clients.has(id))
						{
						    console.log('⚠️ User zaten bağlı, eski connection kapatılıyor');
						    this.clients.get(id).close();
						}

						this.clients.set(id, client);
						onClientConnect(req.query);

						client.on('message',
							(message) =>
							{
								try
								{
									const parsedMessage = JSON.parse(message.toString());
									onMessage(id, parsedMessage);
								}
								catch (error)
								{
									console.error('❌ Invalid JSON message:', error);
								}
							}
						);

						client.on('close',
							() =>
							{
								this.clients.delete(id);
								onClose(id);
								console.log('🟡 Client disconnected');
							}
						);

						client.on('error',
							(error) =>
							{
								console.error('❌ WebSocket error:', error);
								this.clients.delete(id);
							}
						);

						console.log('🟢 Yeni bağlantı:', {
						    userId: id,
						    userName: name,
						    totalClients: this.clients.size + 1
						});
					}
				);
			}.bind(this)
		);

		try
		{
			await this.fastify.listen({ port: this.config.port, host: '0.0.0.0' });
			console.log(`🚀 WebSocket server started on ws://localhost:${this.config.port}`);
		}
		catch (error)
		{
			console.error('❌ Error starting WebSocket server:', error);
			throw error;
		}
	}

	stop()
	{
		if (this.wss)
		{
			this.wss.close(() =>
			{
				console.log('WebSocket server stopped');
			});
			this.wss = null;
		}
		this.clients.clear();
		this.callback.clear();
	}

	broadcast(message)
	{
		const data = typeof message === 'string' ? message : JSON.stringify(message);
		this.clients.forEach(
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
						this.clients.delete(client);
					}
				}
			}
		);
	}

	sendToClient(clientId, message)
	{
		const client = this.clients.get(clientId);
		if (!client)
		{
			console.error(`❌ Client with ID ${clientId} not found`);
			return;
		}
		if (client.readyState === 1)
		{
			try
			{
				const data = typeof message === 'string' ? message : JSON.stringify(message);
				client.send(data);
			}
			catch (error)
			{
				console.error('❌ Error sending message to client:', error);
				this.clients.delete(client);
			}
		}
	}

	getClientCount()
	{
		return this.clients.size;
	}

}

export default WebSocketManager;
