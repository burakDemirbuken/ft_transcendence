import Fastify from 'fastify'
import globalsPlugin from './plugins/globalsPlugin.js'
import jwtMiddleware from './plugins/authorization.js'
import allRoutes from './routes/index.js'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'

const fastify = Fastify({
	logger: true,
	requestTimeout: 30000,
	keepAliveTimeout: 65000,
	connectionTimeout: 30000,
})

await fastify.register(globalsPlugin)

await fastify.register(cookie)

await fastify.register(jwt, {
	secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
	cookie: {
		cookieName: 'accessToken',
		signed: false,
	}
});

await fastify.register(jwtMiddleware)

allRoutes(fastify)

await fastify.ready()

fastify.listen({ port: 3000, host: '0.0.0.0' })
	.then(() => {
		console.log(`Gateway is running ${fastify.server.address().port}`);
		console.log(`requests will be forwarded`);
	}).catch(err => {
		fastify.log.error(err);
		process.exit(1);
	});
