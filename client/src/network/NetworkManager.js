class NetworkManager
{
	constructor(ip, port)
	{
		this.socket = null;
		this.callbacks = new Map();
		this.serverAddress = `ws://${ip}:${port}`;
	}

	connect(endPoint, params = {})
	{
		const param = new URLSearchParams(params);
		const url = `${endPoint}?${param.toString()}`;
		console.log('Connecting to server at', url);
		this.socket = new WebSocket(url);
		this.socket.onopen =
			() =>
			{
				this.triggerCallback('connected');
			};
		this.socket.onmessage =
			(event) =>
			{
				const data = JSON.parse(event.data);
				this.handleMessage(data);
			};

		this.socket.onclose =
			() =>
			{
				console.log('Connection closed');
				this.triggerCallback('disconnected');
			};

		this.socket.onerror =
			(error) =>
			{
				this.triggerCallback('error', error);
			};
	}

	handleMessage(data)
	{
		const { type, payload } = data;
		this.triggerCallback(type, payload);
	}

	send(type, payload)
	{
		if (this.isConnected)
			this.socket.send(JSON.stringify({ type, payload }));
		else
			throw new Error('Cannot send message: not connected to server');
	}

	on(event, callback)
	{
		if (!this.callbacks.has(event))
			this.callbacks.set(event, []);
		this.callbacks.get(event).push(callback);
	}

	off(event, callback)
	{
		if (this.callbacks.has(event))
		{
			const callbacks = this.callbacks.get(event);
			const index = callbacks.indexOf(callback);
			if (index > -1)
				callbacks.splice(index, 1);
		}
	}

	triggerCallback(event, data)
	{
		if (this.callbacks.has(event))
			this.callbacks.get(event).forEach(callback => callback(data));
	}

	disconnect()
	{
		if (this.socket)
			this.socket.close();
	}

	isConnected()
	{
		return this.socket && this.socket.readyState === WebSocket.OPEN;
	}
}

export default NetworkManager;
