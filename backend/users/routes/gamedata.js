export default async function gamedataRoute(fastify, sequelize) {

	fastify.post('/internal/match', async (request, reply) => {
		sequelize.MatchHistory.create({
			teamOneID: request.body.teamOneID,
			teamTwoID: request.body.teamTwoID,
			teamOneScore: request.body.teamOneScore,
			teamTwoScore: request.body.teamTwoScore,
			winnerTeamID: request.body.winnerTeamID,
			matchStartDate: request.body.matchStartDate,
			matchEndDate: request.body.matchEndDate,
			matchtype: request.body.matchtype
		})
		
	})
	
	fastify.post('/internal/tournament', async (request, reply) => {
		
	})

	fastify.get('/internal/stats', async (request, reply) => {

	})
}
