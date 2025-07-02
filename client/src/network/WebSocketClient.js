class WebSocketClient extends EventEmitter
{
	constructor(url)
	{
		super();
		this.url = url;
		this.socket = null;
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 5;
	}

	connect()
	{
		try
		{
			this.socket = new WebSocket(this.url);
			this.setupEventHandlers();
		}
		catch (error)
		{
			this.emit('error', error);
		}
	}

	setupEventHandlers()
	{
		this.socket.onopen =
		() =>
		{
			this.reconnectAttempts = 0;
			this.emit('connected');
		};

		this.socket.onmessage =
		(event) =>
		{
			this.handleMessage(event.data);
		};

		this.socket.onclose =
		() =>
		{
			this.emit('disconnected');
			this.attemptReconnect();
		};
	}

	handleMessage(data)
	{
		try
		{
			const message = JSON.parse(data);
			this.emit('message', message);
		}
		catch (error)
		{
			this.emit('error', new Error('Invalid JSON message'));
		}
	}

	send(message)
	{
		if (this.isConnected())
			this.socket.send(JSON.stringify(message));
		else
			this.emit('error', new Error('Not connected'));
	}

	isConnected()
	{
		return this.socket && this.socket.readyState === WebSocket.OPEN;
	}
}
