import fp from 'fastify-plugin'
import dotenv from 'dotenv'

dotenv.config()

async function globalsPlugin(fastify, options)
{
	if (!process.env.JWT_SECRET)
		throw ( new Error('JWT_SECRET environment variable is required! Please set it in .env file'));

	if (process.env.JWT_SECRET.length < 32)
		console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security!');

	const services =
	{
		auth:		"http://authentication:3001",
		gateway:	"http://gateway:3000",
		email:		"http://email:3005",
		profile:	"http://profile:3006",
		gameServer: "http://gameserver:3003",
		static:		"http://static:3008",
		friend:		"http://friend:3007",
	};

	const settings =
	{
		port: 3000,
		host: '0.0.0.0',
	};

	const secrets =
	{
		jwtSecret: process.env.JWT_SECRET,
	};

	const publicPaths =
	[
		/^\/auth\/register$/,
		/^\/auth\/verify-email/,
		/^\/auth\/login$/,
		/^\/auth\/verify-2fa$/,
		/^\/auth\/check-username$/,
		/^\/auth\/health$/,
		/^\/auth\/hellokitty$/,
	];

	fastify.decorate('services',	services);
	fastify.decorate('settings',	settings);
	fastify.decorate('secrets',		secrets);

	fastify.decorate('isPublicPath', function(path)
	{
		return (publicPaths.some((pattern) => pattern.test(path)));
	});

	fastify.decorate('getServiceUrl', function(serviceName)
	{
		return (this.services[serviceName]);
	});

}

export default fp(globalsPlugin, { name: 'globals-plugin', fastify: '4.x' });
