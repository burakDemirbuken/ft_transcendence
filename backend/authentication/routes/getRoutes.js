import  getController   from    '../controllers/GetController.js';
import  { verifyEmail } from    '../controllers/PostController.js';

export async function getRoutes(fastify, options)
{


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
                        minLength: 1,
                        maxLength: 20,
                        pattern: '^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+$'
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

    fastify.get('/health',
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
    }, getController.healthCheck);
}