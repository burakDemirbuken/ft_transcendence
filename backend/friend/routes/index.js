import friendChangeRoutes from './friendchange.js'
import friendListRoutes from './friendlist.js'

export default async function (fastify) {
    await fastify.register(friendChangeRoutes)
    await fastify.register(friendListRoutes)
}
