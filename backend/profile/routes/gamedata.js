export default async function gamedataRoute(fastify) {

	fastify.post('/internal/match', async (request, reply) => {
		const { r_player1, r_player2, r_winner, r_score, r_duration} = request.body;

		fastify.sequelize.models.MatchHistory.create({
			player1: r_player1,
			player2: r_player2,
			winner: r_winner,
			score: r_score,
			duration: r_duration
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
