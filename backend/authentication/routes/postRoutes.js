import authController from '../controllers/AuthController.js';

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
						minLength: 3,
						maxLength: 50
					},
				    email:
					{
						type: 'string',
						format: 'email'
					},
				    password:
					{ 
						type: 'string',
						minLength: 8
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
    }, authController.register);

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
						type: 'string' 
					},
                    password:
					{
						type: 'string'
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
    }, authController.login);

    fastify.post('/verify-email',
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
						type: 'string',
						minLength: 32,
						maxLength: 64
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
    }, authController.verifyEmail);

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
    }, authController.verify2FA);

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
    }, authController.logout);

    fastify.post('/refresh',
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
    }, authController.refreshToken);

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
    }, authController.checkTokenBlacklist);

    fastify.post('/blacklist-tokens',
    {
    	schema:
    	{
    		body:
    		{
    			type: 'object',
    			properties:
    			{
    				accessToken:
					{
						type: 'string'
					},
    				refreshToken:
					{
						type: 'string'
					}
    			}
    		}
    	}
    }, authController.blacklistTokens);

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
	}, authController.autoRefreshToken);
  
}
