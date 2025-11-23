import  getController   from    '../controllers/GetController.js';
import  postController  from    '../controllers/PostController.js';
import  { verifyEmail } from    '../controllers/PostController.js';

export async function getRoutes(fastify, options)
{
    // Token validation endpoint - kullanıcı bilgisini döner
    fastify.get('/me', async (request, reply) => {
        try {
            const cookieToken = request.cookies?.accessToken;
            const headerToken = request.headers?.authorization?.replace('Bearer ', '');
            const token = cookieToken || headerToken;

            if (!token) {
                return reply.status(401).send({
                    success: false,
                    error: 'No token provided'
                });
            }

            const decoded = request.server.jwt.verify(token);
            const User = (await import('../models/User.js')).default;
            const user = await User.findByPk(decoded.userId);

            if (!user) {
                return reply.status(404).send({
                    success: false,
                    error: 'User not found'
                });
            }

            return reply.send({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    display_name: user.display_name
                }
            });
        } catch (error) {
            return reply.status(401).send({
                success: false,
                error: 'Invalid token'
            });
        }
    });

    fastify.get('/check-email',
    {
        schema:
        {
            querystring:
            {
                type: 'object',
                required:
                [
                    'email'
                ],
                properties:
                {
                    email:
                    {
                        type: 'string',
                        format: 'email'
                    },
                    lang:
                    {
                        type: 'string'
                    }
                }
            }
        }
    }, getController.checkEmail);

    fastify.get('/check-username',
    {
        schema:
        {
            querystring:
            {
                type: 'object',
                required:
                [
                    'username'
                ],
                properties:
                {
                    username:
                    {
                        type: 'string',
                        minLength: 3,
                        maxLength: 50
                    },
                    lang:
                    {
                        type: 'string'
                    }
                }
            }
        }
    }, getController.checkUsername);

    fastify.get('/verify-email',
    {
        schema:
        {
            querystring:
            {
                type: 'object',
                required:
                [
                    'token'
                ],
                properties:
                {
                    token:
                    {
                        type: 'string',
                        minLength: 32,
                        maxLength: 64 
                    },
                    lang:
                    {
                        type: 'string'
                    }
                }
            }
        }
    }, verifyEmail);

    fastify.get('/me',
    {
        schema:
        {
            querystring:
            {
                type: 'object',
                properties:
                {
                    lang:
                    {
                        type: 'string'
                    }
                }
            }
        }
    }, getController.getProfile);

    fastify.get('/profile',
    {
        schema:
        {
            querystring:
            {
                type: 'object',
                properties:
                {
                    lang:
                    {
                        type: 'string'
                    }
                }
            }
        }
    }, getController.getProfile);



}