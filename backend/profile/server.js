import Fastify from 'fastify'
import gamedataRoute from './routes/gamedata.js'
import checkachievement from './plugins/checkachievement.js'
import profileRoute from './routes/profile.js'
import dbPlugin from './plugins/db.js'
import overview from 'fastify-overview'

const fastify = Fastify({
  logger: true,
})

fastify.register(overview)
fastify.register(dbPlugin)
fastify.register(checkachievement)
fastify.register(gamedataRoute)
fastify.register(profileRoute)

await fastify.ready()

try {
  const address = await fastify.listen({ port: 3006, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
