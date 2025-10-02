import { Op } from 'sequelize'

export default async function friendListRoutes(fastify) {
    fastify.get('/list', async (request, reply) => {
        const { id } = request.query
        const friends = await fastify.sequelize.models.Friend.findAll({
            where: {
                [Op.or]: [
                    { userid: id },
                    { peerid: id }
                ],
                status: 'accepted'
            }
        })
        //return reply.code(200).send(friends.map(friend => friend.userid === id ? friend.peerid : friend.userid))
        return reply.code(200).send(friends)
    })

    fastify.delete('/list', async (request, reply) => {
        // delete friendships if both peerid and userid null
        // if it's not both null, set given id to null 
    })
}
