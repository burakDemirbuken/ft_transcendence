import Fastify from 'fastify'
import dbPlugin from './plugins/db.js'
import fastifyWebsocket from '@fastify/websocket'
import friendchange from './plugins/friendchange.js'
import friendListRoutes from './routes/friendlist.js'
import friendRoutes from './routes/friendRoutes.js'

const fastify = Fastify({
    logger: true
})

const presence = new Map()
fastify.decorate('presence', presence)

await fastify.register(dbPlugin)
await fastify.register(fastifyWebsocket)
await fastify.register(friendRoutes)
await fastify.register(friendListRoutes)
await fastify.register(friendchange)
await fastify.ready()

fastify.listen({ port: 3007, host: '0.0.0.0' })
    .then((address) => console.log(`Friend service listening at ${address}`))
    .catch((err) => {
        fastify.log.error(err)
        process.exit(1)
    })
