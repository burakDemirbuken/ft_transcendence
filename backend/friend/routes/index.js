import friendListRoutes from './friendlist.js'
import onlineOfflineRoutes from './onlineoffline.js'

export default async function (fastify) {
    await fastify.register(friendListRoutes)
    await fastify.register(onlineOfflineRoutes)
}
