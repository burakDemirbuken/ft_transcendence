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
			url: '/:serviceName/*',
			handler: async (request, reply) => {
				const serviceName = request.params.serviceName;
				const restPath = request.params['*'] || '';
				const servicePath = gateway.services[serviceName];
				 
				console.log(`Service requested: ${serviceName}, Path: ${restPath}`);
				console.log(`Service URL: ${servicePath}`);
				
				if (servicePath === undefined)
					return reply.code(404).send({ error: 'Service not found' });

				const targetUrl = restPath ? `${servicePath}/${restPath}` : servicePath;
				
				console.log(`Target URL: ${targetUrl}`);

				const queryString = new URLSearchParams(request.query).toString();
				const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;
				
				console.log(`Forwarding ${request.method} request to: ${finalUrl}`);

				try {
					// Forward the request to the target service
					const headers = { ...request.headers };
					
					// Remove headers that shouldn't be forwarded or might cause conflicts
					delete headers['content-type'];
					delete headers['content-length']; // Critical: Remove original content-length
					delete headers['host']; // Remove original host
					delete headers['connection'];
					delete headers['transfer-encoding'];
					
					const body = request.method !== 'GET' && request.method !== 'HEAD' ? JSON.stringify(request.body) : undefined;
					
					const fetchHeaders = { ...headers };
					// Only add Content-Type if there's a body
					if (body) {
						fetchHeaders['Content-Type'] = 'application/json';
					}
					
					const response = await fetch(finalUrl, {
						method: request.method,
						headers: fetchHeaders,
						body: body
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
					gateway.log.error(`Error forwarding request to ${finalUrl}`);
					gateway.log.error(`Error details:`, error);
					gateway.log.error(`Error message: ${error.message}`);
					gateway.log.error(`Error code: ${error.code}`);
					gateway.log.error(`Error cause: ${error.cause}`);
					
					return reply.code(500).send({ 
						error: 'Internal server error', 
						message: 'Failed to forward request to service',
						service: serviceName,
						details: error.message
					});
				}
			}
		});
	});
};
