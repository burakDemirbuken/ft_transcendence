class NetworkManager
{
	constructor(ip, port)
	{
		this.socket = null;
		this.serverAddress = `ws://${ip}:${port}`;

		this.callbacks = {
			onConnect : null,
			onMessage: null,
			onClose: null,
			onError: null
		}
	}

	connect(params = {})
	{
		try
		{
			let url = `${this.serverAddress}`;
			this.socket = new WebSocket(url);

			const { onConnect, onMessage, onClose, onError } = this.callbacks;

			if (!onConnect || !onMessage || !onClose || !onError
					|| typeof onConnect !== 'function' || typeof onMessage !== 'function' || typeof onClose !== 'function' || typeof onError !== 'function')
			{
				throw new Error('WebSocket callbacks not properly set');
			}

			this.socket.onopen = () => {
				console.log('✅ WebSocket connected successfully');
				onConnect();
			};

			this.socket.onmessage = (event) => {
				try {
					const data = event.data;
					const stringData = data.toString();
					const parsedData = JSON.parse(stringData);
					onMessage(parsedData);
				} catch (error) {
					console.error('❌ Failed to parse WebSocket message:', error);
					console.error('Raw message data:', event.data);
				}
			};

			this.socket.onclose = (event) => {
				console.log('🔌 WebSocket connection closed:', event.code, event.reason);
				onClose({ code: event.code, reason: event.reason });
			};

			this.socket.onerror = (error) => {
				console.error('❌ WebSocket error:', error);
				onError(error);
			};

		} catch (error) {
			console.error('❌ Failed to create WebSocket connection:', error);
			throw error;
		}
	}

	onConnect(callback)
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

	// Var olan mesajlaşma şekli (type, payload)
	send(type, payload)
	{
		if (this.isConnected())
			this.socket.send(JSON.stringify({ type, payload }));
		else
			throw new Error('Cannot send message: not connected to server');
	}

	// Ham JSON string gönderimi (AI sunucusu üst seviye alanları bekliyor)
	sendRaw(messageString)
	{
		if (this.isConnected())
			this.socket.send(messageString);
		else
			throw new Error('Cannot send message: not connected to server');
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
