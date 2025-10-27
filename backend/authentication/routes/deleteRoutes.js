import	deleteRoutes	from	'../controllers/AuthController.js';

export default async function deleteRoute(fastify, options)
{
	fastify.delete('/profile',
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
  	}, deleteRoutes.deleteProfile);
}
