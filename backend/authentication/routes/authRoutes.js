import authController from '../controllers/AuthController.js';

/**
 * JWT verification middleware with automatic refresh
 */
async function verifyJWT(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Access token failed, try refresh
    const refreshToken = request.cookies.refreshToken;
    
    if (!refreshToken) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    try {
      // Find user by refresh token
      const User = (await import('../models/User.js')).default;
      const user = await User.findOne({
        where: { refresh_token: refreshToken }
      });

      if (!user || !user.isRefreshTokenValid(refreshToken)) {
        if (user) await user.clearRefreshToken();
        return reply.status(401).send({
          success: false,
          error: 'Session expired, please login again',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }

      // Generate new tokens
      const newAccessToken = await reply.jwtSign(
        {
          userId: user.id,
          username: user.username,
          email: user.email
        },
        { expiresIn: '1h' } // 1 hour
      );

      // Calculate remaining time for refresh token
      const now = new Date();
      const remainingMs = user.refresh_token_expires_at.getTime() - now.getTime();
      
      // Generate new refresh token with remaining time (remember me durumuna göre)
      const crypto = await import('crypto');
      const newRefreshToken = crypto.randomBytes(64).toString('hex');
      user.refresh_token = newRefreshToken;
      // Remember me durumunu koru ve kalan süreyi ona göre ayarla
      const maxDays = user.remember_me ? 30 : 3;
      const maxMs = maxDays * 24 * 60 * 60 * 1000;
      // Kalan süre ile maksimum sürenin küçüğünü al
      const newExpiryMs = Math.min(remainingMs, maxMs);
      user.refresh_token_expires_at = new Date(Date.now() + newExpiryMs);
      await user.save();

      // Set new cookies
      reply.setCookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 1 * 60 * 60 * 1000 // 1 hour
      });

      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: newExpiryMs
      });

      // Verify the new token and continue
      request.cookies.accessToken = newAccessToken;
      await request.jwtVerify();
      
    } catch (refreshErr) {
      console.log('Auto-refresh failed:', refreshErr);
      reply.status(401).send({
        success: false,
        error: 'Authentication failed',
        code: 'AUTO_REFRESH_FAILED'
      });
    }
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
        required: ['login', 'code'],
        properties: {
          login: { type: 'string' },
          code: { type: 'string', minLength: 6, maxLength: 6 },
          rememberMe: { type: 'boolean' }
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
