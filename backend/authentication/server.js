import 'dotenv/config';
import Fastify from 'fastify';
import register from './srcs/registration.js';
import { sequelize, testConnection } from './models/database.js';
import fs from 'fs';

const fastify = Fastify(
{
	logger: { level: 'trace'},
	requestTimeout: 30000,
	keepAliveTimeout: 65000,
	connectionTimeout: 30000,
});

const start = async () =>
{
	try
	{
    	await register.registration(fastify);
    	if (!fs.existsSync('./data'))
    		fs.mkdirSync('./data', { recursive: true });
    	await testConnection();
		await sequelize.sync({ force: false });

    	await fastify.listen
    	({
    		port: 3001,
    		host: '0.0.0.0'
    	});
	}
	catch ( error )
	{
		console.error('Failed to start server:', error); fastify.log.error('Failed to start server:', error);
		process.exit(1);
	}
};

start();
