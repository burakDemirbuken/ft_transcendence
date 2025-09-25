import authController from '../controllers/AuthController.js';

/**
 * JWT verification middleware
 */
async function verifyJWT(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Authentication Routes
 */
export default async function authRoutes(fastify, options) {
  
  // Health check endpoint
  fastify.get('/health', authController.health);

  // Check endpoints
  fastify.get('/check-email', {
    schema: {
      querystring: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }, authController.checkEmail);

  fastify.get('/check-username', {
    schema: {
      querystring: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 }
        }
      }
    }
  }, authController.checkUsername);

  // Public routes - No authentication required
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 }
        }
      }
    }
  }, authController.register);

  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['login', 'password'],
        properties: {
          login: { type: 'string' }, // email or username
          password: { type: 'string' }
        }
      }
    }
  }, authController.login);

  // Email verification (both GET with token in URL and POST with token in body)
  fastify.get('/verify-email', {
    schema: {
      querystring: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 32, maxLength: 64 }
        }
      }
    }
  }, authController.verifyEmail);

  fastify.post('/verify-email', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 32, maxLength: 64 }
        }
      }
    }
  }, authController.verifyEmail);

  // 2FA verification
  fastify.post('/verify-2fa', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string', minLength: 6, maxLength: 6 }
        }
      }
    }
  }, authController.verify2FA);

  // Simplified authentication - removed other complex routes

  // Protected routes - Authentication required
  fastify.register(async function protectedRoutes(fastify) {
    // Add JWT verification to all routes in this context
    fastify.addHook('preHandler', verifyJWT);

    // User profile endpoints
    fastify.get('/me', authController.getProfile);
    fastify.get('/profile', authController.getProfile);

    // Logout
    fastify.post('/logout', authController.logout);
  });
}
