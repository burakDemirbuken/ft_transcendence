import { Op } from 'sequelize'

export default async function friendListRoutes(fastify) {
    fastify.get('/list', async (request, reply) => {
        const { userName } = request.query
        if (!userName) {
            return reply.code(400).send({ error: 'Username is required' });
        }
        
        const friendships = await fastify.sequelize.models.Friend.findAll({
            where: {
                status: 'accepted',
                [Op.or]: [
                    { userName: userName },
                    { peerName: userName }
                ],
                attributes: ['userName', 'peerName']
            }
        })

        const friendIds = [
            ...new Set(friendships.map(f => 
                (f.userName === userName ? f.peerName : f.userName)).filter(Boolean))
        ]

        const friendProfiles = await Promise.all(friendIds.map(async (friendName) => {
                try {
                    const response = await fetch('http://profile:3006/internal/friend', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userName: friendName })
                    })
                    if (!response.ok) throw new Error('Network response was not ok')
                    
                    const data = await response.json()
                    
                    return {
                        ...data
                    }
                    
                
                } catch (error) {
                    fastify.log.error(error)
                    return null
                }
            })
        )

    })

    fastify.delete('/list', async (request, reply) => {
        const { userName } = request.body ?? {};

        if (!userName) {
            return reply.code(400).send({ error: 'Username is required' });
        }

        await fastify.sequelize.models.Friend.destroy({
            where: { 
                [Op.or]: [
                    { userName: userName },
                    { peerName: userName }
                ]
            }
        })
    })
}
