export default async function friendChangeRoutes(fastify) {
    fastify.post('/send', async (request, reply) => {
        const { userName, peerName } = request.body 

        if (!userName || !peerName) {
            return reply.status(400).send({ error: "userName and peerName are required." })
        }

        if (userName === peerName) {
            return reply.status(400).send({ error: "Cannot send friend request to oneself." })
        }

        await fastify.sequelize.models.Friend.create({ userName, peerName, status: 'pending' })
        return reply.status(201).send( { message: "Friend request sent." } )
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
            return reply.status(204).send( {message: "Friend request accepted."} )
        } else {
            return reply.status(404).send( {message: "Friend request not found."} )
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
        if (deletedCount) {
            return reply.status(204).send( {message: "Friend request removed."} )
        } else {
            return reply.status(404).send( {message: "Friend request not found."} )
        }
    })
}
