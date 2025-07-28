class NetworkManager
{
	constructor()
	{
		this.socket = null;
		this.isConnected = false;
		this.serverUrl = null;
		this.callbacks = new Map();

		// URL'den user bilgisi varsa onu kullan, yoksa rastgele oluştur
		if (!this.getUserFromURL()) {
			const randomId = this.generateRandomId();
			const randomName = this.generateRandomName();
			this.serverUrl = `ws://10.12.8.2:3000/ws?id=${randomId}&name=${randomName}`;
			console.log(`🎮 Generated test user: ID=${randomId}, Name=${randomName}`);
		}
	}

	generateRandomId()
	{
		// 6 haneli rastgele alfanumerik ID
		return Math.random().toString(36).substr(2, 6).toUpperCase();
	}

	generateRandomName()
	{
		const names = [
			'Player', 'Gamer', 'User', 'Tester', 'Demo',
			'Alpha', 'Beta', 'Gamma', 'Delta', 'Echo'
		];
		const randomName = names[Math.floor(Math.random() * names.length)];
		const randomNumber = Math.floor(Math.random() * 999) + 1;
		return `${randomName}${randomNumber}`;
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
			() =>
			{
				this.isConnected = false;
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

	// Debug modunda manuel user bilgisi set etme
	setTestUser(id, name)
	{
		this.serverUrl = `ws://localhost:3000/ws?id=${id}&name=${name}`;
		console.log(`🔧 Manual test user set: ID=${id}, Name=${name}`);
	}

	// URL'den user bilgisini alma (debug için)
	getUserFromURL()
	{
		const urlParams = new URLSearchParams(window.location.search);
		const id = urlParams.get('id');
		const name = urlParams.get('name');

		if (id && name) {
			this.setTestUser(id, name);
			return true;
		}
		return false;
	}
}

export default NetworkManager;
