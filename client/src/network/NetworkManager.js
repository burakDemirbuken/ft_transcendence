
class NetworkManager
{
	constructor()
	{
		this.socket = null;
		this.isConnected = false;
		this.serverUrl = 'ws://localhost:3000/ws';
		this.callbacks = new Map();
	}

	connect()
	{
		this.socket = new WebSocket(this.serverUrl);
		console.log('Connecting to server:', this.serverUrl);
		this.socket.onopen =
			() =>
			{
				this.isConnected = true;
				this.triggerCallback('connected');
			};

		this.socket.onmessage =
			(event) =>
			{
				const data = JSON.parse(event.data);
				this.handleMessage(data);
			};

		this.socket.onclose =
			() => {
				this.isConnected = false;
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
}

export default NetworkManager;
