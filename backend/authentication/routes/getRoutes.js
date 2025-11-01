import  getController   from    '../controllers/GetController.js';
import  postController  from    '../controllers/PostController.js';
import  { verifyEmail } from    '../controllers/PostController.js';

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

    fastify.get('/change-email',
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
    }, getController.showEmailChangeForm);

    fastify.get('/change-password',
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
    }, getController.showPasswordChangeForm);

    fastify.get('/verify-new-email',
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
    }, postController.verifyNewEmail);
}