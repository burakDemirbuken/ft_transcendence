import fp from 'fastify-plugin'
import dotenv from 'dotenv'

dotenv.config()

async function globalsPlugin(fastify, options) {
	const services = {
		auth: "http://authentication:3001",
		gateway: "http://gateway:3000", 
		email: "http://email:3005",
		profile: "http://profile:3006",
		gameServer: "http://gameserver:3003"
	};

	const settings =
	{
		port: 3000,
		host: process.env.HOST || '0.0.0.0',
	};

	const secrets =
	{
		jwtSecret: process.env.JWT_SECRET || 'default_secret',
	};

	const publicPaths =
	[
		/^\/auth\/register$/,
		/^\/auth\/verify-email/,
		/^\/auth\/login$/,
		/^\/auth\/verify-2fa$/,
		/^\/auth\/check-email$/,
		/^\/auth\/check-username$/,
		/^\/auth\/health$/,
		/^\/auth\/change-email$/,
		/^\/auth\/process-email-change$/,
		/^\/auth\/verify-new-email$/,
	];

	fastify.decorate('services', services);
	fastify.decorate('settings', settings);
	fastify.decorate('secrets', secrets);
	
	fastify.decorate('isPublicPath', function(path)
	{
		return (publicPaths.some((pattern) => pattern.test(path)));
	});

	fastify.decorate('getServiceUrl', function(serviceName)
	{
		return (this.services[serviceName]);
	});

}

export default fp(globalsPlugin, {
	name: 'globals-plugin',
	fastify: '4.x'
});
