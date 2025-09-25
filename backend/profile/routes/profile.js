export default async function profileRoute(fastify) {

	fastify.get('/profile', async (request, reply) => { 
		const userName = request.user.username;
		const userProfile = await fastify.sequelize.models.Profile.findOne({
			where: { userName: userName },
			include: fastify.sequelize.models.Stats
		});

		if (!userProfile) {
			return reply.code(404).send({ error: 'User not found' });
		}

		return userProfile;
	});

	fastify.delete('/profile', async (request, reply) => {
		
	});

	fastify.put('/profile', async (request, reply) => {
		
	});
}
