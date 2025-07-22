import {
  register,
  loginUser,
  getProfile,
  verify2FA,
  //updateUser,
  logoutUser,
  refreshAccessToken
} from '../controllers/userController.js';

export default async function userRoutes(fastify, opts) {
  fastify.post('/register', register);
  fastify.post('/login', loginUser);
  fastify.post('/verify-2fa', verify2FA);
  fastify.get('/me', { preHandler: [fastify.authenticate] }, getProfile);  
  // 🆕 Yeni rotalar
  
  //fastify.put('/update', { preHandler: [fastify.authenticate] }, updateUser);
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, logoutUser);
  fastify.post('/refresh-token', refreshAccessToken);

}
