import Fastify from 'fastify'
import gamedataRoute from './routes/gamedata.js'
import checkachievement from './plugins/checkachievement.js'
import profileRoute from './routes/profile.js'
import dbPlugin from './plugins/db.js'
import overview from 'fastify-overview'

const fastify = Fastify({
  logger: true
})

fastify.register(overview)
fastify.register(dbPlugin)
fastify.register(checkachievement)

fastify.addHook('onRequest', async (request) => {
  fastify.log.info(`Incoming request: ${request.method} ${request.url}`)
  fastify.log.info(`Request headers: ${JSON.stringify(request.headers)}`)
  fastify.log.info(`Request body: ${JSON.stringify(request.body)}`)
})

fastify.addHook('onResponse', async (request, reply) => {
  fastify.log.info(`Response status: ${reply.statusCode} for ${request.method} ${request.url}`)
})

fastify.register(gamedataRoute)
fastify.register(profileRoute)

await fastify.ready()

try {
  const address = await fastify.listen({ port: 3006, host: '0.0.0.0' })
  fastify.log.info(`Server listening at ${address}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
