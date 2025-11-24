import	deleteRoutes	from	'../controllers/AuthController.js';

export default async function deleteRoute(fastify, options)
{
	fastify.delete('/confirm-delete-account',
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
					},
					code:
					{
						type: 'string',
						pattern: '^[0-9]{6}$'
					}
    	    	}
    	  	}
    	}
  	}, deleteRoutes.confirmDeleteAccount);
}
