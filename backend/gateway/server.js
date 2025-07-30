import Fastify from 'fastify'
import globalsPlugin from './plugins/globalsPlugin.js'
import allRoutes from './routes/index.js'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'

const gateway = Fastify({ logger: true })

await gateway.register(globalsPlugin);

await gateway.register(jwt, {
secret: gateway.secrets.jwtSecret,
});

await gateway.register(cookie);

allRoutes(gateway);

gateway.listen({ port: 3000, host: '0.0.0.0' }, async (err, address) => {
	if (err) {
		gateway.log.error(err);
		process.exit(1);
	}
	console.log(`Gateway is running ${address}`);
	console.log(`requests will be forwarded`);
});
