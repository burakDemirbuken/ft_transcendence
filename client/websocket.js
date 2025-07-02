
class socket
{
	constructor(url, onopen, onmessage, onclose, onerror)
	{
		this.socket = new WebSocket(url);
		this.onopen(onopen);
		this.onmessage(onmessage);
		this.onclose(onclose);
		this.onerror(onerror);
	}

	onopen(callback)
	{
		this.socket.onopen = callback;
	}

	onmessage(callback)
	{
		this.socket.onmessage = callback;
	}

	onclose(callback)
	{
		this.socket.onclose = callback;
	}

	onerror(callback)
	{
		this.socket.onerror = callback;
	}


	send(message)
	{
		if (this.socket.readyState === WebSocket.OPEN)
			this.socket.send(message);
		else
			console.error("WebSocket already closed or not open");
	}

	close()
	{
		if (this.socket.readyState === WebSocket.OPEN)
			this.socket.close();
		else
			console.error("WebSocket is not open, canno.t close");
	}
}
