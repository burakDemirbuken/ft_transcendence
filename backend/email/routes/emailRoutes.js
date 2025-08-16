import EmailController from '../controllers/EmailController.js'

export default async function emailRoutes(fastify, opts) {
  // Test endpoint
  fastify.get('/test', async (req, rep) => {
    rep.send({
      success: true,
      message: 'Email service çalışıyor! 📧',
      timestamp: new Date().toISOString(),
      service: 'email-service',
      version: '1.0.0'
    })
  })

  // 2FA email endpoint
  fastify.post('/send-2fa', EmailController.send2FA)
  
  // Welcome email endpoint
  fastify.post('/send-welcome', EmailController.sendWelcome)
  
  // Login notification endpoint
  fastify.post('/send-login-notification', EmailController.sendLoginNotification)
  
  // Account deletion email endpoints
  fastify.post('/send-deletion-code', EmailController.sendDeletionCode)
  fastify.post('/send-deletion-confirmation', EmailController.sendDeletionConfirmation)
  
  // Password reset email endpoint
  fastify.post('/send-password-reset', EmailController.sendPasswordReset)
  
  // Test connection endpoint
  fastify.get('/test-connection', EmailController.testConnection)
}
