import fp from 'fastify-plugin'
import dotenv from 'dotenv'

dotenv.config()

async function globalsPlugin(fastify, options) {
	const services = {
		auth: "http://authentication:3001",
		gateway: "http://gateway:3000",
//		nginx: "http://nginx:9000",
		email: "http://email:3005",
		profile: "http://profile:3006",
		gameServer: "http://gameserver:3003",	
		room: "http://room:3004"
	};

	const settings = {
		port: 3000,
		host: process.env.HOST || '0.0.0.0', //sadece nginx eklenebilir
	};

	const secrets = {
		jwtSecret: process.env.JWT_SECRET || 'default_secret',
	};

	const publicPaths = [
		/^\/auth\/login$/,
		/^\/auth\/register$/,
		/^\/auth\/verify-email/,
		/^\/auth\/forgot-password$/,
		/^\/auth\/reset-password$/,
		/^\/auth\/resend-verification$/,
		/^\/auth\/verify-2fa$/,
		/^\/auth\/refresh-token$/,
		/^\/auth\/check-email$/,
		/^\/auth\/check-username$/,
		/^\/auth\/test$/,
		/^\/auth\/health$/,
		/^\/auth\/stats$/,
		/^\/email\/test$/,
		/^\/email\/health$/,
		/^\/email\/test-connection$/,
	];
	const adminPaths = [
		/^\/auth\/admin$/,
	];

	fastify.decorate('services', services);
	fastify.decorate('settings', settings);
	fastify.decorate('secrets', secrets);
	//fastify.decorate('publicpaths', publicpaths);
	//fastify.decorate('adminpaths', adminpaths);

	fastify.decorate('isPublicPath', function(path) {
		return publicPaths.some((pattern) => pattern.test(path));
	});

	fastify.decorate('isAdminPath', function(path) {
		return adminPaths.some((pattern) => pattern.test(path));
	});

	fastify.decorate('getServiceUrl', function(serviceName) {
		return this.services[serviceName];
	});

}

// Plugin'i fastify-plugin ile wrap et
export default fp(globalsPlugin, {
	name: 'paths-plugin', //??
	fastify: '4.x'
});
