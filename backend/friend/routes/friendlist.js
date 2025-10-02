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
}
