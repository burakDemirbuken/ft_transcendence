import EmailController from '../controllers/EmailController.js'

export default async function emailRoutes(fastify, opts) {
  fastify.post('/send-2fa', EmailController.send2FA)
  
  fastify.post('/send-login-notification', EmailController.sendLoginNotification)

  fastify.post('/send-verification', EmailController.sendVerification)
}
