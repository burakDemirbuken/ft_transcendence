import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import path from 'path';
import fs from 'fs';
import { sequelize, testConnection } from './models/database.js';
import authRoutes from './routes/authRoutes.js';

const fastify = Fastify({
  logger: true,
  requestTimeout: 30000,
  keepAliveTimeout: 65000,
  connectionTimeout: 30000,
});

// Cookie support
await fastify.register(cookie);

// JWT configuration
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  cookie: {
    cookieName: 'accessToken',
    signed: false,
    credentials: true,
  }
});

// Register routes
await fastify.register(authRoutes);

// 404 handler
fastify.setNotFoundHandler(async (request, reply) => {
  reply.status(404).send({
    success: false,
    error: 'Route not found',
    path: request.url,
    service: 'authentication-service'
  });
});

// Error handler
fastify.setErrorHandler(async (error, request, reply) => {
  request.log.error(error);
  reply.status(500).send({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
const start = async () => {

  try {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    await testConnection();

    await sequelize.sync({ force: false });
    
    await fastify.listen
    ({
      port: 3001,
      host: '0.0.0.0'
    });

//    console.log(fastify.printRoutes());

  } catch (error) {
    fastify.log.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
