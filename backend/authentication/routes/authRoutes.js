import AuthController from '../controllers/AuthController.js';

// JWT verify middleware
async function verifyToken(req, rep) {
  try {
    await req.jwtVerify();
  } catch (err) {
    rep.status(401).send({
      success: false,
      error: 'Geçersiz token'
    });
  }
}

export default async function authRoutes(fastify, opts) {
  // Public routes
  fastify.post('/register', AuthController.register);
  fastify.get('/login', AuthController.login);
  fastify.post('/logout', AuthController.logout);
  
  // Protected routes
  fastify.get('/me', { preHandler: verifyToken }, AuthController.me);
  
  // Public stats
  fastify.get('/stats', AuthController.stats);
  
  // Test endpoint
  fastify.get('/test', async (req, rep) => {
    rep.send({
      success: true,
      message: 'Authentication service çalışıyor',
      timestamp: new Date().toISOString()
    });
  });

  console.log("✅ Auth routes registered");
}
