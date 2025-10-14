import authController from '../controllers/AuthController.js';

export async function getRoutes(fastify, options)
{
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
    }, authController.checkEmail);

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
    }, authController.checkUsername);

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
    }, authController.verifyEmail);

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
    }, authController.getProfile);

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
    }, authController.getProfile);
}