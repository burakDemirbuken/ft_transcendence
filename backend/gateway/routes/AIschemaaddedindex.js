import FastifyProxy from '@fastify/http-proxy'
import { validateRequest } from '../plugins/byAIschema.js';
import { verifyJWT, checkAdmin } from '../plugins/authorization.js';
import gl from '../plugins/globalsPlugin.js';

export default async function allRoutes(gateway, opts) {
	await gateway.register(FastifyProxy, {
		upstream: async (req, res) => {
			const [_, service, ...rest] = req.url.split('/');
			const servicePath = gl.services[service];
			if (!servicePath) {
				res.code(404).send({ error: 'Service not found' });
				return;
			}
			const newUrl = `${servicePath}/${rest.join('/')}`;
			console.log(`Forwarding request to ${newUrl}`);
			console.log(`Request method: ${req.method}`);
			console.log(`Request headers: ${JSON.stringify(req.headers)}`);
			console.log(`Request body: ${JSON.stringify(req.body)}`);
			console.log(`Request service: ${service}`);
			console.log(`Request servicePath: ${servicePath}`);
			return newUrl;
		},
		preHandler: async (request, reply) => {
			// Schema validation for request body
			if (request.body && Object.keys(request.body).length > 0) {
				try {
					const validation = validateRequest(request.method, request.url, request.body);
					if (!validation.valid) {
						return reply.code(400).send({
							error: 'Validation failed',
							details: validation.errors
						});
					}
				} catch (error) {
					console.error('Schema validation error:', error);
					// Continue without validation if schema not found
				}
			}

			if (gl.publicpaths[request.url]) { // Public path, no authentication needed 
				return;
			}
			
			// JWT verification for protected routes
			await verifyJWT(request, reply);
			
			// Admin check for admin routes
			if (gl.adminpaths[request.url]) {
				await checkAdmin(request, reply);
			}
		},
		rewritePrefix: request.url.split('/')[1],
	},
)};
