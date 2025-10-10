import { verifyJWT, checkAdmin } from '../plugins/authorization.js'

export default async function allRoutes(fastify) {
	fastify.register(async function (fastify) {
		fastify.addHook('onRequest', async (request, reply) => {
			// Schema controll can be added here if needed
			if (fastify.isPublicPath(request.path))
				return;
			//await verifyJWT(request, reply);
			if (fastify.isAdminPath(request.path)) {
				await checkAdmin(request, reply);
			}
		});

		fastify.route({
			method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
			url: '/:serviceName/*',
			handler: async function (request, reply) {
				const serviceName = request.params.serviceName;
				const restPath = request.params['*'] || '';
				const servicePath = fastify.services[serviceName];

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

					// Remove problematic headers
					delete headers['host'];
					delete headers['content-length'];
					delete headers['connection'];
					delete headers['content-type']; // Remove to avoid duplicates

					let body = undefined;
					if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
						body = JSON.stringify(request.body);
						headers['Content-Type'] = 'application/json';
					}

					const response = await fetch(finalUrl, {
						method: request.method,
						headers: headers,
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
					fastify.log.error(`Error forwarding request to ${finalUrl}`);
					fastify.log.error(`Error details:`, error);
					fastify.log.error(`Error message: ${error.message}`);
					fastify.log.error(`Error code: ${error.code}`);
					fastify.log.error(`Error cause: ${error.cause}`);

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
