import	postController	from	'../controllers/PostController.js';
import	authController	from	'../controllers/AuthController.js';

export async function postRoutes(fastify, options)
{
	fastify.post('/register',
	{
		schema:
		{
			body:
            {
				type: 'object',
				required:
				[
					'username',
					'email',
					'password'
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
				    email:
					{
						type: 'string',
						format: 'email',
						minLength: 5,
						maxLength: 254
					},
				    password:
					{ 
						type: 'string',
						minLength: 8,
						maxLength: 128
					}
				}	
			},
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
    }, postController.register);

    fastify.post('/login',
    {
    	schema:
        {
            body:
            {
                type: 'object',
                required:
				[
					'login',
					'password'
				],
                properties:
                {
                    login:
					{
						type: 'string',
						minLength: 1
					},
                    password:
					{
						type: 'string',
						minLength: 8,
						maxLength: 128
					}
                }
            },
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
    }, postController.login);



    fastify.post('/verify-2fa',
    {
        schema:
        {
            body:
            {
                type: 'object',
                required:
				[
					'login',
					'code'
				],
                properties:
                {
                    login:
					{
						type: 'string'
					},
                    code:
					{
						type: 'string',
						minLength: 6,
						maxLength: 6
					},
                    rememberMe:
					{
						type: 'boolean'
					}
                }
            },
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
    }, postController.verify2FA);

    fastify.post('/logout',
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
    }, postController.logout);



    fastify.post('/check-token-blacklist',
    {
  		schema:
  		{
  			body:
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
						type: 'string'
					}
  				}
  			}
  		}
    }, postController.checkTokenBlacklist);



    fastify.post('/auto-refresh',
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
	}, postController.autoRefreshToken);

	fastify.post('/init-email-change',
	{
		schema:
		{
			body:
			{
				type: 'object',
				required:
				[
					'newEmail',
					'password'
				],
				properties:
				{
					newEmail:
					{ 
						type: 'string',
						format: 'email'
					},
					password:
					{ 
						type: 'string', 
						minLength: 6 
					}
				}
			},
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
	}, postController.initEmailChange);

	fastify.post('/confirm-email-change',
	{
		schema:
		{
			body:
			{
				type: 'object',
				required:
				[
					'code'
				],
				properties:
				{
					code:
					{
						type: 'string',
						pattern: '^[0-9]{6}$'
					}
				}
			},
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
	}, postController.confirmEmailChange);





	fastify.post('/init-password-change',
	{
		schema:
		{
			body:
			{
				type: 'object',
				required:
				[
					'currentPassword',
					'newPassword'
				],
				properties:
				{
					currentPassword:
					{
						type: 'string',
						minLength: 6
					},
					newPassword:
					{
						type: 'string',
						minLength: 6
					}
				}
			}
		}
	}, postController.initPasswordChange);

	fastify.post('/confirm-password-change',
	{
		schema:
		{
			body:
			{
				type: 'object',
				required:
				[
					'code'
				],
				properties:
				{
					code:
					{
						type: 'string',
						pattern: '^[0-9]{6}$'
					}
				}
			}
		}
	}, postController.confirmPasswordChange);

	fastify.post('/init-delete-account',
	{
		schema:
		{
			body:
			{
				type: 'object',
				required:
				[
					'password'
				],
				properties:
				{
					password:
					{
						type: 'string',
						minLength: 6
					}
				}
			}
		}
	}, postController.initDeleteAccount);
}
