import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import path from 'path';
import fs from 'fs';

// Import database and models
import { sequelize, testConnection } from './models/database.js';
import User from './models/User.js';
import authRoutes from './routes/authRoutes.js';

const fastify = Fastify({ 
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  }
});

// CORS configuration
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
});

// Cookie support
await fastify.register(cookie);

// JWT configuration
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  cookie: {
    cookieName: 'accessToken',
    signed: false,
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

    // Test database connection
    await testConnection();
    
    // Sync database models
    await sequelize.sync({ force: false });
    console.log('✅ Database models synchronized');

    // Start the server
    await fastify.listen({
      port: process.env.PORT || 3001,
      host: process.env.HOST || '0.0.0.0'
    });

    console.log('🚀 Authentication Service started successfully');
    console.log('📋 Available routes:');
    fastify.printRoutes();

  } catch (error) {
    fastify.log.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
