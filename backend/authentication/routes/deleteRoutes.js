import	deleteRoutes	from	'../controllers/AuthController.js';

export default async function deleteRoute(fastify, options)
{
	fastify.delete('/profile',
	{
		schema:
		{
    	    body:
			{
    	    	type: 'object',
    	    	properties:
				{
    	      		userId:
					{
						type: 'number'
					},
    	      		userEmail:
					{
						type: 'string'
					},
    	      		username:
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
  	}, deleteRoutes.deleteProfile);
}
