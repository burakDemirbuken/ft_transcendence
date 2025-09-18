export default async function profileRoute(fastify) {

	fastify.get('/profile', async (request, reply) => { 
		const profile = await fastify.db.models.User.findOne({ 
			where: { id: request.query.id },
			include: fastify.db.models.Stats.findOne({ 
				where: { userId: request.query.id },
				raw: true
			}),
			raw: true
		})

		if (!profile) {
			return reply.code(404).send({ error: 'User not found' })	
		}

		return profile
	});

	fastify.delete('/profile', async (request, reply) => {
		const user = await fastify.db.models.User.findOne({ where: { id: request.query.id } });

		if (!user) {
			reply.code(404).send({ error: 'User not found' });
			return;
		}

		const stats = await fastify.db.models.Stats.findOne({ where: { userId: request.query.id } });
		if (stats) {
			await stats.destroy();
		}

		await user.destroy();

		reply.code(200).send({ message: 'User deleted successfully' });
	});

	fastify.put('/profile', async (request, reply) => {
		const { id, displayName, avatarUrl, bio } = request.body;
		const user = await fastify.db.models.User.findOne({ where: { id } });

		if (!user) {
			return reply.code(404).send({ error: 'User not found' });
		}

		user.displayName = displayName || user.displayName;
		user.avatarUrl = avatarUrl || user.avatarUrl;
		user.bio = bio || user.bio;

		await user.save();

		return reply.code(200).send(user);
	});
}
