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

        return reply.code(200).send(friends)
    })

    fastify.delete('/list', async (request, reply) => {
        const { UserName } = request.body ?? {};

        if (!UserName) {
            return reply.code(400).send({ error: 'Username is required' });
        }

        await fastify.sequelize.models.Friend.destroy({
            where: { 
                [Op.or]: [
                    { userName: UserName },
                    { peerName: UserName }
                ]
            }
        })
    })
}
