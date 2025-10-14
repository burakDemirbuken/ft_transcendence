import authController from '../controllers/AuthController.js';
import { postRoutes }from './postRoutes.js';
import { getRoutes }from './getRoutes.js';

export default async function authRoutes(fastify, options)
{
	await postRoutes(fastify, options);
	await getRoutes(fastify, options);

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
  	}, authController.deleteProfile);


}
