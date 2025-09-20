import Fastify from 'fastify'
import gamedataRoute from './routes/gamedata.js'
import profileRoute from './routes/profile.js'
import friendRoute from './routes/friend.js'

const fastify = Fastify({
  logger: true
})

fastify.register(gamedataRoute)
fastify.register(profileRoute)
fastify.register(friendRoute)

fastify.listen({ port: 3006, host: '0.0.0.0' }, async (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`Server listening at ${address}`)
})
