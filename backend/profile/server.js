import Fastify from 'fastify'
import gamedataRoute from './routes/gamedata.js'
import checkachievement from './plugins/checkachievement.js'
import profileRoute from './routes/profile.js'
import dbPlugin from './plugins/db.js'
import utils from './plugins/utils.js'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'

const fastify = Fastify({
	logger: false,
})

fastify.register(jwt, {
	secret: process.env.JWT_SECRET
})
fastify.register(cookie)
fastify.register(utils)
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
