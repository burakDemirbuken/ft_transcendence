import fp from 'fastify-plugin'
import dotenv from 'dotenv'


dotenv.config()

async function globalsPlugin(fastify, options) {
	const services = {
		auth: "http://authentication:3001",
		gateway: "http://gateway:3000",
		nginx: "http://nginx:9000",
		user: "http://user:3002",
		gameserver: "http://gameserver:3003",
		livechat: "http://livechat:3004",
		email: "http://email:3005",
	};

	const settings = {
		port: 3000,
		host: process.env.HOST || '0.0.0.0', //sadece nginx eklenebilir
	};

	const secrets = {
		jwtSecret: process.env.JWT_SECRET || 'default_secret',
	};

	const publicpaths = {
		'/auth/login': true,
		'/auth/register': true,
		'/auth/verify-2fa': true,
		'/auth/refresh-token': true,
		'/auth/check-email': true,
		'/auth/check-username': true,
		'/auth/test': true,
		'/auth/health': true,
		'/auth/stats': true,
		'/email/test': true,
		'/email/health': true,
		'/email/test-connection': true,
	};

	const adminpaths = {
		'/auth/admin': true, //deneme
	};

	fastify.decorate('services', services);
	fastify.decorate('settings', settings);
	fastify.decorate('secrets', secrets);
	fastify.decorate('publicpaths', publicpaths);
	fastify.decorate('adminpaths', adminpaths);

	fastify.decorate('isPublicPath', function(path) {
		return this.publicpaths[path] === true;
	});

	fastify.decorate('isAdminPath', function(path) {
		return this.adminpaths[path] === true;
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

/* // Backward compatibility için globals objesini de export et
export const gl = {
	services: {
		auth: "http://authentication:3001",
		gateway: "http://gateway:3000",
		nginx: "http://nginx:9000",
		user: "http://user:3002",
		gameserver: "http://gameserver:3003",
		livechat: "http://livechat:3004",
	},
	settings: {
		port: 3000,
		host: process.env.HOST || '0.0.0.0',
	},
	secrets: {
		jwtSecret: process.env.JWT_SECRET || 'default_secret',
	},
	publicpaths: {
		'/auth/login': true,
		'/auth/register': true,
		'/auth/forgot-password': true,
		'/auth/reset-password': true,
		'/auth/verify-email': true,
		'/auth/refresh': true,
	},
	adminpaths: {
		'/auth/admin': true,
		'/user/admin': true,
		'/admin/users': true,
		'/admin/ban-user': true,
		'/admin/user-role': true,
	},
};
 */