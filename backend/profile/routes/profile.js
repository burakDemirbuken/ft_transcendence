export default async function profileRoute(fastify) {

	fastify.get('/profile', async (request, reply) => { 
		const { userName } = request.body ?? {};

		if (!userName) {
			return reply.code(400).send({ error: 'Username is required' });
		}

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
		const { userName } = request.body ?? {};
		
		if (!userName) {
			return reply.code(400).send({ error: 'Username is required' });
		}

		const deletedCount = await fastify.sequelize.models.Profile.destroy({
			where: { userName: userName }
		});

		if (deletedCount === 0) {
			return reply.code(404).send({ error: 'User not found' });
		}

		await Promise.all([
			fetch('http://localhost:3007/list', { // if it's go through nginx /friend/list 
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userName: userName })
			}),
			fetch('http://localhost:3001/auth/delete', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userName: userName })
			})
		]).catch(err => { fastify.log.error('Error deleting user from other services:', err) })

		return { message: 'User deleted successfully' };
	});

	fastify.put('/profile', async (request, reply) => {
		const { userName, displayName, bio, avatarUrl } = request.body ?? {};
		
		if (!userName) {
			return reply.code(400).send({ error: 'Username is required' });
		}

		const userProfile = await fastify.sequelize.models.Profile.findOne({
			where: { userName: userName }
		});

		if (!userProfile) {
			return reply.code(404).send({ error: 'User not found' });
		}

		userProfile.bio = bio ?? userProfile.bio;
		userProfile.avatarUrl = avatarUrl ?? userProfile.avatarUrl;
		userProfile.displayName = displayName ?? userProfile.displayName;

		await userProfile.save();

		return reply.code(200).send({ message: 'Profile updated successfully' });
	});
}
