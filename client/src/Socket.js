class Socket
{
	constructor(url)
	{
		this.socket = new WebSocket(url);
		this.socket.onopen = () => console.log("WebSocket bağlantısı açıldı");
		this.socket.onmessage = (event) => console.log("📨 Gelen mesaj:", event.data);
		this.socket.onclose = () => console.log("Bağlantı kapandı");
		this.socket.onerror = (e) => console.error('WebSocket hata:', e);
	}

	send(message)
	{
		if (this.socket.readyState === WebSocket.OPEN)
		{
			this.socket.send(message);
		}
		else
		{
			console.error("WebSocket bağlantısı açık değil");
		}
	}
}
