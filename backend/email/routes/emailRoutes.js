import EmailController from '../controllers/EmailController.js'

export default async function emailRoutes(fastify, opts) {
  // 2FA email endpoint
  fastify.post('/send-2fa', EmailController.send2FA)
  
  // Login notification endpoint
  fastify.post('/send-login-notification', EmailController.sendLoginNotification)

  // Email verification endpoint
  fastify.post('/send-verification', EmailController.sendVerification)
}
