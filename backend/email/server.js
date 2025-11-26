import Fastify from 'fastify'
import emailRoutes from './routes/emailRoutes.js'
import './config/env.js'

const fastify = Fastify({ 
  logger: {
    level: 'info',
  }
})

await fastify.register(emailRoutes)

fastify.get('/health', async (req, rep) => {
  rep.send({
    success: true,
    service: 'email-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

fastify.setNotFoundHandler(async (req, rep) => {
  rep.status(404).send({
    success: false,
    error: 'Endpoint not found',
    path: req.url,
    service: 'email-service'
  })
})

fastify.setErrorHandler(async (error, req, rep) => {
  req.log.error(error)
  rep.status(500).send({
    success: false,
    error: 'Email service error',
    message: error.message
  })
})

fastify.listen({ 
  port: 3005, 
  host: '0.0.0.0' 
}, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.printRoutes()
})
