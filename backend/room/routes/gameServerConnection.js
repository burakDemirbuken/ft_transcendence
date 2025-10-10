// for gameserver websocket

export default async function gameServerConnectionSocket(fastify) {
	fastify.get("/ws/server", {
		websocket: true
	},
	(connection, req) => {
		const client = connection.socket;
		
		
	});
}
