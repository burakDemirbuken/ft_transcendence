type Callback = (data?: any) => void;

interface Callbacks {
	onConnect: Callback | null;
	onMessage: Callback | null;
	onClose: Callback | null;
	onError: Callback | null;
}

class NetworkManager
{
	private socket: WebSocket | null;
	private serverAddress: string;
	private callbacks: Callbacks;

	constructor(ip: string, port: number)
	{
		this.socket = null;
		this.serverAddress = `wss://${ip}:${port}`;

		this.callbacks = {
			onConnect : null,
			onMessage: null,
			onClose: null,
			onError: null
		}
	}

	connect(endpoint: string, params: any = undefined): void
	{
		try
		{
			let url = `${this.serverAddress}` + "/" + endpoint;
			if (typeof(params) !== "undefined")
			{
				url += "?" + new URLSearchParams(params).toString();
			}
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

			this.socket.onmessage = (event: MessageEvent) => {
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

			this.socket.onclose = (event: CloseEvent) => {
				onClose({ code: event.code, reason: event.reason });
			};

			this.socket.onerror = (error: Event) => {
				console.error('❌ WebSocket error:', error);
				onError(error);
			};

		} catch (error) {
			console.error('❌ Failed to create WebSocket connection:', error);
			throw error;
		}
	}

	onConnect(callback: Callback): void
	{
		this.callbacks.onConnect = callback;
	}

	onMessage(callback: Callback): void
	{
		this.callbacks.onMessage = callback;
	}

	onClose(callback: Callback): void
	{
		this.callbacks.onClose = callback;
	}

	onError(callback: Callback): void
	{
		this.callbacks.onError = callback;
	}

	send(type: string, payload: any): void
	{
		if (this.isConnect())
			this.socket!.send(JSON.stringify({ type: type, payload: payload }));
		else
			throw new Error('Cannot send message: not connected to server');
	}

	disconnect(): void
	{
		if (this.socket)
			this.socket.close();
		this.socket = null;
		this.callbacks = {
			onConnect : null,
			onMessage: null,
			onClose: null,
			onError: null
		};
	}

	isConnect(): boolean
	{
		return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
	}
}

export default NetworkManager;
