import Fastify from 'fastify'
import helmet from '@fastify/helmet'
import gamedataRoute from './routes/gamedata.js'
import checkachievement from './plugins/checkachievement.js'
import profileRoute from './routes/profile.js'
import dbPlugin from './plugins/db.js'
import utils from './plugins/utils.js'
import xssSanitizer from './plugins/xssSanitizer.js'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'

const fastify = Fastify({
	logger: true
})

fastify.register(xssSanitizer)

fastify.register(helmet, {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'"],
			styleSrc: ["'self'"],
			imgSrc: ["'self'", "data:", "blob:"],
			objectSrc: ["'none'"],
		}
	}
})

if (!process.env.JWT_SECRET) {
	fastify.log.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.')
	process.exit(1)
}

if (process.env.JWT_SECRET.length < 32) {
	fastify.log.error('FATAL ERROR: JWT_SECRET must be at least 32 characters long for security reasons.')
	process.exit(1)
}

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
