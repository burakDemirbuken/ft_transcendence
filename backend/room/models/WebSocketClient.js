class NetworkManager
{
	constructor(protocol, ip, port, basePath = '')
	{
		this.socket = null;
		// Protocol, ip, port ve basePath'i destekle (nginx için)
		this.serverAddress = `${protocol}//${ip}:${port}${basePath}`;

		this.callbacks = {
			onConnect : null,
			onMessage: null,
			onClose: null,
			onError: null
		}
	}

	connect(endpoint, params)
	{
		try
		{
			let url = `${this.serverAddress}`;
			if (typeof(endpoint) !== "undefined")
				url += "/" + endpoint;
			if (typeof(params) !== "undefined")
				url += "?" + new URLSearchParams(params).toString();
			this.socket = new WebSocket(url);

			const { onConnect, onMessage, onClose, onError } = this.callbacks;

			if (!onConnect || !onMessage || !onClose || !onError
					|| typeof onConnect !== 'function' || typeof onMessage !== 'function' || typeof onClose !== 'function' || typeof onError !== 'function')
			{
				throw new Error('WebSocket callbacks not properly set');
			}

			this.socket.onopen = () => {
				onConnect();
			};

			this.socket.onmessage = (event) => {
				try
				{
					const data = event.data;
					const stringData = data.toString();
					const parsedData = JSON.parse(stringData);

					try
					{
						onMessage(parsedData);
					}
					catch (callbackError)
					{
						console.error('❌ Error in onMessage callback:', callbackError);
						console.error('Message data that caused error:', parsedData);
					}
				}
				catch (parseError)
				{
					console.error('❌ Failed to parse WebSocket message:', parseError);
					console.error('Raw message data:', event.data);
				}
			};

			this.socket.onclose = (event) => {
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
		if (this.isConnect())
			this.socket.send(JSON.stringify({ type: type, payload: payload }));
		else
			throw new Error('Cannot send message: not connected to server');
	}

	sendRaw(message)
	{
		if (this.isConnect())
			this.socket.send(message);
		else
			throw new Error('Cannot send message: not connected to server');
	}

	disconnect()
	{
		if (this.socket)
			this.socket.close();
	}

	isConnect()
	{
		return this.socket && this.socket.readyState === WebSocket.OPEN;
	}
}

export default NetworkManager;
