import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import authRoutes from '../routes/authRoutes.js';
import utils from './utils.js';

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
	await fastify.register( authRoutes );
	await fastify.setNotFoundHandler( utils.NotFoundHandler );
	await fastify.setErrorHandler( utils.InternalServerErrorHandler );

}

export	default	{	registration	};