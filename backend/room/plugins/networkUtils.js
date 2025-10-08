import fp from "fastify-plugin"

export default fp(async function (fastify) {
	function connectionID() {
		return `conn-${Math.random().toString(36).substring(2, 15)}`;
	}

	function addClientConnection(client) {
		const id = connectionID();
		clientConnection.set(id, client);
		return id;
	}

	function disconnectClient(id) {
		const client = clientConnection.get(id);
		if (client) {
			client.close();
			clientConnection.delete(id);
		}
	}

	function sendtoClient(id, message) {
		const client = clientConnection.get(id);
		if (!client)
			throw new Error(`No client found with id: ${id}`);
		if (client.readyState === 1)
			client.send(JSON.stringify(message));
	}

	function broadcastMessage(message) {
		clientConnection.forEach((client, id) => {
			if (client.readyState === 1) {
				client.send(JSON.stringify(message));
			}
		});
	}

}, {
	  name: "networkUtils",
	  fastify: "4.x"
})