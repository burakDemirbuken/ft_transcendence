import Fastify from 'fastify'
import dbPlugin from './plugins/db.js'
import friendRoutes from './routes/index.js'

const fastify = Fastify({
    logger: true
})

await fastify.register(dbPlugin)
await fastify.register(friendRoutes)

await fastify.ready()

fastify.listen({ port: 3007, host: '0.0.0.0' })
    .then((address) => console.log(`Friend service listening at ${address}`))
    .catch((err) => {
        fastify.log.error(err)
        process.exit(1)
    })
