export default async function gamedataRoute(fastify) {

	fastify.post('/internal/match', async (request, reply) => {
		fastify.sequelize.models.MatchHistory.create({
			player1: request.body.player1,
			player2: request.body.player2,
			winner: request.body.winner,
			score: request.body.score,
			duration: request.body.duration
		}).then(match => {
			reply.code(201).send(match);
		}).catch(err => {
			reply.code(500).send({ error: 'Failed to create match history' });
		});
	})
	
	fastify.post('/internal/tournament', async (request, reply) => {
		
	})

	fastify.get('/internal/stats', async (request, reply) => {

	})
}
