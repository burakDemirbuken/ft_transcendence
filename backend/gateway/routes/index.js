import { verifyJWT, checkAdmin } from '../plugins/authorization.js'

export default async function allRoutes(gateway, opts) {
	gateway.register(async function (fastify) {
		fastify.addHook('preHandler', async (request, reply) => {
			// Schema controll can be added here if needed
			if (gateway.isPublicPath(request.path))
				return;
			//await verifyJWT(request, reply);
			if (gateway.isAdminPath(request.path)) {
				await checkAdmin(request, reply);
			}
		});

		fastify.route({
			method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
			url: '/:gateway/*',
			handler: async (request, reply) => {
				const totalPath = request.params['*'].split('/');
				const serviceName = totalPath[0];
				const servicePath = gateway.services[serviceName];
				 
				console.log(`Service requested: ${serviceName}, Path: ${request.params['*']}`);
				console.log(`Service URL: ${servicePath}`);
				
				if (servicePath === undefined)
					return reply.code(404).send({ error: 'Service not found' });

				const restPath = totalPath.slice(1).join('/') || '';
				const targetUrl = restPath ? `${servicePath}/${restPath}` : servicePath;
				
				console.log(`Target URL: ${targetUrl}`);

				const queryString = new URLSearchParams(request.query).toString();
				const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;
				
				console.log(`Forwarding ${request.method} request to: ${finalUrl}`);

				try {
					// Forward the request to the target service
					const response = await fetch(finalUrl, {
						method: request.method,
						headers: {
							'Content-Type': request.headers['content-type'] || 'application/json',
							...request.headers
						},
						body: request.method !== 'GET' && request.method !== 'HEAD' ? JSON.stringify(request.body) : undefined
					});

					// Get the response data
					const responseData = await response.text();
					let parsedData;
					
					try {
						parsedData = JSON.parse(responseData);
					} catch (e) {
						parsedData = responseData;
					}

					// Forward the response status and data
					reply.code(response.status);
					
					// Forward response headers
					response.headers.forEach((value, key) => {
						if (key !== 'content-length' && key !== 'transfer-encoding') {
							reply.header(key, value);
						}
					});

					return parsedData;
				} catch (error) {
					gateway.log.error(`Error forwarding request to ${finalUrl}: ${error.message}`);
					return reply.code(500).send({ 
						error: 'Internal server error', 
						message: 'Failed to forward request to service',
						service: serviceName
					});
				}
			}
		});
	});
};
