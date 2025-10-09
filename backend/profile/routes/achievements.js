export default async function achievementsRoute(fastify) {
    fastify.get('/achievements', async (request, reply) => {
        const { userName } = request.body ?? {}

        if (!userName) {
            return reply.code(400).send({ error: 'Username is required' });
        }

    })

}