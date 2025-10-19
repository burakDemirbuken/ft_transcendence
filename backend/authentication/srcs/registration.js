import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import authRoutes from '../routes/authRoutes.js';
import utils from './utils.js';

async function registration(fastify)
{
	await fastify.register(cookie);
	
    await fastify.register(jwt,
	{
		secret:'your-super-secret-jwt-key-change-in-production', // Bunu production'da değiştir
		cookie:
    	{
			cookieName: 'accessToken',
        	signed: false,
        	credentials: true,
    	}
	});
	await fastify.register(authRoutes);
	await fastify.setNotFoundHandler(utils.NotFoundHandler);
	await fastify.setErrorHandler(utils.InternalServerErrorHandler);

}

export	default	{	registration	};