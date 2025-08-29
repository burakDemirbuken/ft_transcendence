import {
  register,
  loginUser,
  getProfile,
  verify2FA,
  //updateUser,
  logoutUser,
  refreshAccessToken,
  checkUsername,
  checkEmail,
  deleteAccount
} from '../controllers/userController.js';

export default async function userRoutes(fastify, opts) {
  fastify.post('/register', register);
  fastify.post('/login', loginUser);
  fastify.post('/verify-2fa', verify2FA);
  fastify.get('/me', { preHandler: [fastify.authenticate] }, getProfile);
  fastify.get('/checkEmail', checkEmail);
  fastify.get('/checkUsername', checkUsername);
  // 🆕 Yeni rotalar
  
  //fastify.put('/update', { preHandler: [fastify.authenticate] }, updateUser);
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, logoutUser);
  fastify.post('/refresh-token', refreshAccessToken);
  fastify.delete('/delete-account', { preHandler: [fastify.authenticate] }, deleteAccount);

}
