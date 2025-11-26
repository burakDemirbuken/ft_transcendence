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

// XSS Protection - must be before routes
await fastify.register(xssSanitizer)

// Security headers with Helmet
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

await fastify.register(multipart)

// JWT secret'ı .env'den al - yoksa hata ver
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
	throw new Error('JWT_SECRET environment variable is required! Please set it in .env file');
}

if (jwtSecret.length < 32) {
	console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security!');
}

await fastify.register(jwt, {
	secret: jwtSecret,
	cookie: {
		cookieName: 'accessToken',
		signed: false,
	}
});

// JWT middleware artık plugin değil, routes'da manuel kullanılacak

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
