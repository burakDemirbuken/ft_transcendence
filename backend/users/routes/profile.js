export default async function profileRoute(fastify) {

	fastify.get('/profile', async (request, reply) => { 
		return await fastify.db.models.User.findOne({ where: { id: request.query.id } })
	});

	fastify.delete('/profile', async (request, reply) => {
		const user = await fastify.db.models.User.findOne({ where: { id: request.query.id } });
		if (!user) {
			reply.code(404).send({ error: 'User not found' });
			return;
		}
		await user.destroy();
		reply.code(200).send({ message: 'User deleted successfully' });
	});
}
