class NetworkManager
{
	constructor(ip, port)
	{
		this.socket = null;
		this.isConnected = false;
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
			let url = `${this.serverAddress}` + "/ws?" + new URLSearchParams(params).toString();
			console.log('Connecting to server at', url);
			this.socket = new WebSocket(url);

			const { onConnect, onMessage, onClose, onError } = this.callbacks;

			if (!onConnect || !onMessage || !onClose || !onError
					|| typeof onConnect !== 'function' || typeof onMessage !== 'function' || typeof onClose !== 'function' || typeof onError !== 'function')
			{
				throw new Error('WebSocket callbacks not properly set');
			}

			this.socket.onopen = () => {
				console.log('✅ WebSocket connected successfully');
				this.isConnected = true;
				onConnect();
			};

			this.socket.onmessage = (event) => {
				try {
					const data = event.data;
					const stringData = data.toString();
					const parsedData = JSON.parse(stringData);
					console.log('📩 Received message:', parsedData);
					onMessage(parsedData);
				} catch (error) {
					console.error('❌ Failed to parse WebSocket message:', error);
					console.error('Raw message data:', event.data);
				}
			};

			this.socket.onclose = (event) => {
				console.log('🔌 WebSocket connection closed:', event.code, event.reason);
				this.isConnected = false;
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

	send(type, payload)
	{
		if (this.isConnected)
			this.socket.send(JSON.stringify({ type, payload }));
		else
			throw new Error('Cannot send message: not connected to server');
	}

	disconnect()
	{
		this.isConnected = false;
		if (this.socket)
			this.socket.close();
	}

	isConnect()
	{
		return this.socket && this.socket.readyState === WebSocket.OPEN;
	}
}

export default NetworkManager;
