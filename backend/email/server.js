import Fastify from 'fastify'
import cors from '@fastify/cors'
import emailRoutes from './routes/emailRoutes.js'
import './config/env.js'

const fastify = Fastify({ 
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  }
})

// CORS ayarları
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
})

// Routes'ları register et
await fastify.register(emailRoutes)

// Health check endpoint
fastify.get('/health', async (req, rep) => {
  rep.send({
    success: true,
    service: 'email-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// 404 handler
fastify.setNotFoundHandler(async (req, rep) => {
  rep.status(404).send({
    success: false,
    error: 'Endpoint bulunamadı',
    path: req.url,
    service: 'email-service'
  })
})

// Error handler
fastify.setErrorHandler(async (error, req, rep) => {
  req.log.error(error)
  rep.status(500).send({
    success: false,
    error: 'Email servisi hatası',
    message: error.message
  })
})

// Start server
fastify.listen({ 
  port: process.env.EMAIL_PORT || 3005, 
  host: process.env.HOST || '0.0.0.0' 
}, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`📧 Email Service çalışıyor: ${address}`)
  
  // Tüm route'ları listele
  console.log("📋 Registered email routes:")
  fastify.printRoutes()
})
