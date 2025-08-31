import Fastify from 'fastify'

const fastify = Fastify({
  logger: true
})

fastify.register(require('./plugins/db'))


fastify.listen({ port: 3006, host: '0.0.0.0' }, async (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`Server listening at ${address}`)
})
