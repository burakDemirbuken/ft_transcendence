import AuthController from '../controllers/AuthController.js'
import { accessTokenBlacklist } from '../utils/authServices.js'

// JWT verify middleware with blacklist check
async function verifyToken(req, rep) {
  try {
    await req.jwtVerify()
    
    // Blacklist kontrolü
    const token = req.cookies?.accessToken
    if (token && accessTokenBlacklist.isBlacklisted(token)) {
      throw new Error('Token blacklisted')
    }
  } catch (err) {
    rep.status(401).send({
      success: false,
      error: 'Geçersiz veya geçmemiş token'
    })
  }
}

export default async function authRoutes(fastify, opts) {
  // Public routes - Authentication not required
  console.log("📝 Registering POST /register")
  fastify.post('/register', AuthController.register)

  console.log("📝 Registering POST /login") 
  fastify.post('/login', AuthController.login)
  
  console.log("📝 Registering POST /verify-2fa")
  fastify.post('/verify-2fa', AuthController.verify2FA)
  
  console.log("📝 Registering POST /refresh-token")
  fastify.post('/refresh-token', AuthController.refreshToken)
  
  console.log("📝 Registering GET /check-email")
  fastify.get('/check-email', AuthController.checkEmail)
  
  console.log("📝 Registering GET /check-username")
  fastify.get('/check-username', AuthController.checkUsername)
  
  // Protected routes - Authentication required
  console.log("📝 Registering GET /me")
  fastify.get('/me', { preHandler: verifyToken }, AuthController.me)
  
  console.log("📝 Registering POST /logout")
  fastify.post('/logout', { preHandler: verifyToken }, AuthController.logout)
  
  // Public stats
  console.log("📝 Registering GET /stats")
  fastify.get('/stats', AuthController.stats)
  
  // Test endpoint
  fastify.get('/test', async (req, rep) => {
    rep.send({
      success: true,
      message: 'Authentication service çalışıyor! 🔐',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      features: [
        '2FA Authentication',
        'JWT + Refresh Tokens',
        'Email Service Integration',
        'Token Blacklisting',
        'Session Management'
      ]
    })
  })

  // Health check endpoint
  fastify.get('/health', async (req, rep) => {
    rep.send({
      success: true,
      service: 'authentication',
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  })
}
