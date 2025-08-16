import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import authRoutes from './routes/authRoutes.js'

const fastify = Fastify({ 
  logger: {
    level: 'info',
  }
})

// CORS ayarları
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
})

// Cookie desteği
await fastify.register(cookie)

// JWT ayarları
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
  cookie: {
    cookieName: 'accessToken',
    signed: false,
  }
})


// Routes'ları register et
await fastify.register(authRoutes)

// 404 handler
fastify.setNotFoundHandler(async (req, rep) => {
  rep.status(404).send({
    success: false,
    error: 'Route bulunamadııı',
    path: req.url
  })
})

// Error handler
fastify.setErrorHandler(async (error, req, rep) => {
  req.log.error(error)
  rep.status(500).send({
    success: false,
    error: 'Sunucu hatası'
  })
})

fastify.listen({ 
  port: process.env.PORT || 3001, 
  host: process.env.HOST || '0.0.0.0' 
}, (err, address) => {
  if (err) {
    console.log("error");
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 API çalışıyor: ${address}`);
  
  // Tüm route'ları listele
  console.log("📋 Registered routes:");
  fastify.printRoutes();
})