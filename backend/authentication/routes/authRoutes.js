import authController from '../controllers/AuthController.js';

/**
 * Auth service artık sadece JWT oluşturma işi yapıyor
 * JWT verification gateway'de yapılıyor
 */

/**
 * Authentication Routes
 */
export default async function authRoutes(fastify, options) {

  // Health check endpoint
  fastify.get('/health', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          lang: { type: 'string' }
        }
      }
    }
  }, authController.health);

  // Check endpoints
  fastify.get('/check-email', {
    schema: {
      querystring: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          lang: { type: 'string' }
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
          username: { type: 'string', minLength: 3, maxLength: 50 },
          lang: { type: 'string' }
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
      },
      querystring: {
        type: 'object',
        properties: {
          lang: { type: 'string' }
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
      },
      querystring: {
        type: 'object',
        properties: {
          lang: { type: 'string' }
        }
      }
    }
  }, authController.login);

  // Email verification (GET)
  fastify.get('/verify-email', {
    schema: {
      querystring: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 32, maxLength: 64 },
          lang: { type: 'string' }
        }
      }
    }
  }, authController.verifyEmail);

  // Email verification (POST)
  fastify.post('/verify-email', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 32, maxLength: 64 }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          lang: { type: 'string' }
        }
      }
    }
  }, authController.verifyEmail);

  // 2FA verification
  fastify.post('/verify-2fa', {
    schema: {
      body: {
        type: 'object',
        required: ['login', 'code'],
        properties: {
          login: { type: 'string' },
          code: { type: 'string', minLength: 6, maxLength: 6 }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          lang: { type: 'string' }
        }
      }
    }
  }, authController.verify2FA);

  // User profile endpoints - JWT kontrolü gateway'de yapılıyor
  fastify.get('/me', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          lang: { type: 'string' }
        }
      }
    }
  }, authController.getProfile);

  fastify.get('/profile', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          lang: { type: 'string' }
        }
      }
    }
  }, authController.getProfile);

  // Logout endpoint
  fastify.post('/logout', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          lang: { type: 'string' }
        }
      }
    }
  }, authController.logout);

  // Refresh token endpoint
  fastify.post('/refresh', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          lang: { type: 'string' }
        }
      }
    }
  }, authController.refreshToken);
}
