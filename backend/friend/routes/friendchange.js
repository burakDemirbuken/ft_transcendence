export default async function friendChangeRoutes(fastify) {
    fastify.post('/send', async (request, reply) => {
        const { userName, peerName } = request.body
        await fastify.sequelize.models.Friend.create({ userName, peerName, status: 'pending' })
        return reply.status(201).send()
    })

    fastify.post('/accept', async (request, reply) => {
        const { peerName } = request.body
        const friend = await fastify.sequelize.models.Friend.findOne({
            where: {
                peerName: peerName,
                status: 'pending'
            }
        })
        if (friend) {
            friend.status = 'accepted'
            await friend.save()
            return reply.status(204).send()
        } else {
            return reply.status(404).send()
        }
    })

    fastify.post('/remove', async (request, reply) => {
        const { userName, peerName } = request.body
        const deletedCount = await fastify.sequelize.models.Friend.destroy({
            where: {
                userName: userName,
                peerName: peerName
            }
        })
        if (deletedCount > 0) {
            return reply.status(204).send()
        } else {
            return reply.status(404).send()
        }
    })
}
