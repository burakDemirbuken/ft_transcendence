export default async function friendChangeRoutes(fastify) {
    fastify.post('/send', async (request, reply) => {
        const { userid, peerid } = request.body
        await fastify.sequelize.models.Friend.create({ userid, peerid, status: 'pending' })
        return reply.status(201).send()
    })

    fastify.post('/accept', async (request, reply) => {
        const { peerid } = request.body
        const friend = await fastify.sequelize.models.Friend.findOne({
            where: {
                peerid,
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

    fastify.post('/block', async (request, reply) => {
        const { userid, peerid } = request.body
        let friend = await fastify.sequelize.models.Friend.findOne({
            where: {
                userid,
                peerid
            }
        })
        if (friend) {
            friend.status = 'blocked'
            await friend.save()
            return reply.status(204).send()
        } else {
            await sequelize.models.Friend.create({ userid, peerid, status: 'blocked' })
            return reply.status(201).send()
        }
    })

    fastify.post('/remove', async (request, reply) => {
        //unfriend someone
        const { userid, peerid } = request.body
        const deletedCount = await fastify.sequelize.models.Friend.destroy({
            where: {
                userid,
                peerid
            }
        })
        if (deletedCount > 0) {
            return reply.status(204).send()
        } else {
            return reply.status(404).send()
        }
    })
}
