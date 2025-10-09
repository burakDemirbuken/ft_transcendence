export default async function achievementsRoute(fastify) {
    fastify.get('/achievements', async (request, reply) => {
        const { userName } = request.body ?? {}

        if (!userName) {
            return reply.code(400).send({ error: 'Username is required' });
        }

        try {
            const profile = await fastify.db.profiles.findOne({
                where: { userName }
            }) //profilden ayrı olacaksa burayı değiştir

            if (!profile) {
                return reply.code(404).send({ error: 'Profile not found' });
            }

            const userProgress = await fastify.checkAchievements.getAchievementProgress(userName)
            return reply.send({
                userName: userName,
                achievements: userProgress
            })
        
        } catch (error) {
            fastify.log.error("Error getting achievements", error)
            return reply.code(500).send({ error: 'Internal Server Error' })
        }
    })
}
