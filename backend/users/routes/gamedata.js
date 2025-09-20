export default async function gamedataRoute(fastify, sequelize) {

	fastify.post('/internal/match', async (request, reply) => {
		console.log(request.body)
	})
	
	fastify.post('/internal/tournament', async (request, reply) => {
		
	})

	fastify.get('/internal/stats', async (request, reply) => {

	})
}
