import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import authRoutes from '../routes/authRoutes.js';
import utils from './utils.js';
import utilsPlugin from '../plugins/utils.js';
import xssSanitizer from '../plugins/xssSanitizer.js';

async function registration(fastify)
{
	// JWT secret'ı .env'den al - yoksa hata ver
	const jwtSecret = process.env.JWT_SECRET;
	
	if (!jwtSecret) {
		throw new Error('JWT_SECRET environment variable is required! Please set it in .env file');
	}
	
	if (jwtSecret.length < 32) {
		console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security!');
	}

	await fastify.register( cookie );
	
	// XSS Protection - must be registered early
	await fastify.register( xssSanitizer );
	
	// Security headers with Helmet
	await fastify.register( helmet, {
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'"],
				styleSrc: ["'self'"],
				imgSrc: ["'self'", "data:"],
				connectSrc: ["'self'"],
				fontSrc: ["'self'"],
				objectSrc: ["'none'"],
				frameSrc: ["'none'"],
			}
		}
	});
	
    await fastify.register( jwt,
	{
		secret: jwtSecret,
		cookie:
    	{
			cookieName: 'accessToken',
        	signed: false,
        	credentials: true,
    	}
	});
	await fastify.register( utilsPlugin );
	await fastify.register( authRoutes );
	await fastify.setNotFoundHandler( utils.NotFoundHandler );
	await fastify.setErrorHandler( utils.InternalServerErrorHandler );

}

export	default	{	registration	};