import	{	postRoutes	}	from	'./postRoutes.js';
import	{	getRoutes	}	from	'./getRoutes.js';
import	deleteRoutes from './deleteRoutes.js';

export default async function authRoutes(fastify, options)
{
	await postRoutes	(	fastify,	options	);
	await getRoutes		(	fastify,	options	);
	await deleteRoutes	(	fastify,	options	);
}
