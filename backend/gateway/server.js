import 'dotenv/config';
import Fastify from 'fastify'
import helmet from '@fastify/helmet'
import globalsPlugin from './plugins/globalsPlugin.js'
import xssSanitizer from './plugins/xssSanitizer.js'
import allRoutes from './routes/index.js'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'

const fastify = Fastify({
	logger: true,
	requestTimeout: 30000,
	keepAliveTimeout: 65000,
	connectionTimeout: 30000,
})

await fastify.register(globalsPlugin)

await fastify.register(xssSanitizer)

await fastify.register(helmet, {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			imgSrc: ["'self'", "data:", "blob:"],
			connectSrc: ["'self'"],
			fontSrc: ["'self'"],
			objectSrc: ["'none'"],
			mediaSrc: ["'self'"],
			frameSrc: ["'none'"],
		}
	},
	crossOriginEmbedderPolicy: false,
	crossOriginResourcePolicy: { policy: "cross-origin" }
})

await fastify.register(cookie)

await fastify.register(multipart, {
	limits: {
		fileSize: 5 * 1024 * 1024
	}
})

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
	fastify.log.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.')
	process.exit(1)
}

if (jwtSecret.length < 32) {
	fastify.log.error('FATAL ERROR: JWT_SECRET must be at least 32 characters long for security reasons.')
	process.exit(1)
}

await fastify.register(jwt, {
	secret: jwtSecret,
	cookie: {
		cookieName: 'accessToken',
		signed: false,
	}
});

fastify.setErrorHandler(async (error, request, reply) => {
	request.log.error(error);
	
	if (error.validation) {
		const field = error.validation[0]?.instancePath?.replace('/', '') || error.validation[0]?.params?.missingProperty || 'field';
		const message = error.validation[0]?.message || 'Validation failed';
		
		const userFriendlyMessage = field ? `${field}: ${message}` : message;
		
		return reply.status(400).send({
			success: false,
			error: userFriendlyMessage
		});
	}
	
	reply.status(error.statusCode || 500).send({
		success: false,
		error: error.statusCode === 500 ? 'Internal server error' : error.message
	});
});

allRoutes(fastify)

await fastify.ready()

fastify.listen({ port: 3000, host: '0.0.0.0' })
	.catch(err => {
		fastify.log.error(err);
		process.exit(1);
	});
