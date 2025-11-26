import jwtMiddleware from '../plugins/authorization.js';

export default async function allRoutes(fastify)
{
		fastify.register(async function (fastify)
		{	
			await fastify.register(jwtMiddleware);
			fastify.addHook('preHandler', async (request, reply) =>
			{
				if (fastify.isAdminPath && fastify.isAdminPath(request.url))
				{
					if (!request.user || request.user.role !== 'admin')
						return ( reply.code(403).send({ success: false, error: 'Admin access required', code: 'ADMIN_ACCESS_REQUIRED' }) );
				}
			});

			fastify.route({ method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'], url: '/:serviceName/*', handler: async function (request, reply)
			{

				const serviceName = request.params.serviceName;
				const restPath = request.params['*'] || '';
				const servicePath = fastify.services[serviceName];
				if (servicePath === undefined)
					return ( reply.code(404).send({ error: 'Service not found' }) );
				const targetUrl = restPath ? `${servicePath}/${restPath}` : servicePath;
				const queryString = new URLSearchParams(request.query).toString();
				const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;
				try
				{
					const headers = { ...request.headers };
					if (request.user)
					{
						headers['x-user-id'] = request.user.userId;
						headers['x-user-username'] = request.user.username;
						headers['x-user-email'] = request.user.email;
						headers['user-agent'] = request.headers['user-agent'] || '';
						if (request.user.role)
							headers['x-user-role'] = request.user.role;
					}

					if (request.newAccessToken)
					{
						const cookieParts = headers['cookie'] ? headers['cookie'].split('; ') : [];
						const filteredCookies = cookieParts.filter(c => !c.startsWith('accessToken='));
						filteredCookies.push(`accessToken=${request.newAccessToken}`);
						headers['cookie'] = filteredCookies.join('; ');
					}

					delete headers['host'];
					delete headers['content-length'];
					delete headers['connection'];
					let body = undefined;
					const isMultipart = request.headers['content-type']?.includes('multipart/form-data');
					if (request.method !== 'GET' && request.method !== 'HEAD')
					{
						if (isMultipart)
						{
							const formData = new FormData();
							if (request.isMultipart())
							{
								const parts = request.parts();
								for await (const part of parts)
								{
									if (part.file)
									{
										const buffer = await part.toBuffer();
										const blob = new Blob([buffer], { type: part.mimetype });
										formData.append(part.fieldname, blob, part.filename);
									}
									else
										formData.append(part.fieldname, part.value);
								}
							}
							body = formData;
							delete headers['content-type'];
						}
						else if (request.body)
						{
							body = JSON.stringify(request.body);
							headers['Content-Type'] = 'application/json';
							delete headers['content-type'];
						}
					}
					const response = await fetch(finalUrl, { method: request.method, headers: headers, body: body });
					const contentType = response.headers.get('content-type') || '';
					const isBinary = contentType.startsWith('image/') || 
									 contentType.startsWith('video/') ||
									 contentType.startsWith('audio/') ||
									 contentType.includes('octet-stream');
					let parsedData;
					if (isBinary)
					{
						const buffer = await response.arrayBuffer();
						parsedData = Buffer.from(buffer); // altı çizili neden ??
					}
					else
					{
						const responseData = await response.text();
						try
						{
							parsedData = JSON.parse(responseData);
						}
						catch (e)
						{
							parsedData = responseData;
						}
					}
					reply.code(response.status);
					response.headers.forEach((value, key) =>
					{
						if (key !== 'content-length' && key !== 'transfer-encoding')
							reply.header(key, value);
					});
					return ( parsedData );
				}
				catch (error)
				{
					fastify.log.error(`Error forwarding request to ${finalUrl}`);
					fastify.log.error(`Error details: ${error}`);
					fastify.log.error(`Error message: ${error.message}`);
					fastify.log.error(`Error code: ${error.code}`);
					fastify.log.error(`Error cause: ${error.cause}`);
					return ( reply.code(500).send({ error: 'Internal server error', message: 'Failed to forward request to service', service: serviceName, details: error.message }) );
				}
			}
		});
	});
};
