import { register, loginUser, getProfile,verify2FA } from '../controllers/userController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';

export default async function (fastify) {
  fastify.post('/register', register);
  fastify.get('/profile', { preHandler: verifyJWT }, getProfile);
  fastify.post('/login', loginUser);
  fastify.post('/verify-2fa', verify2FA);
}
