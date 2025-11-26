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
	logger: true,
})

// XSS Protection
fastify.register(xssSanitizer)

// Security headers
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

// JWT secret must be set in .env
if (!process.env.JWT_SECRET) {
	throw new Error('JWT_SECRET environment variable is required! Please set it in .env file');
}

if (process.env.JWT_SECRET.length < 32) {
	console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security!');
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

// Custom error handler for validation errors
fastify.setErrorHandler(async (error, request, reply) => {
	request.log.error(error);
	
	// Schema validation error
	if (error.validation) {
		const field = error.validation[0]?.instancePath?.replace('/', '') || error.validation[0]?.params?.missingProperty || 'field';
		const message = error.validation[0]?.message || 'Validation failed';
		
		// Basit ve net: field + orijinal mesaj
		const userFriendlyMessage = field ? `${field}: ${message}` : message;
		
		return reply.status(400).send({
			success: false,
			error: userFriendlyMessage
		});
	}
	
	// Diğer hatalar
	reply.status(error.statusCode || 500).send({
		success: false,
		error: error.statusCode === 500 ? 'Internal server error' : error.message
	});
})

await fastify.ready()

try {
	const address = await fastify.listen({ port: 3006, host: '0.0.0.0' })
} catch (err) {
	fastify.log.error(err)
	process.exit(1)
}
