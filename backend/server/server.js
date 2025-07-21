import Fastify from 'fastify';
import userRoutes from './routes/userRoutes.js';
import fastifyJwt from '@fastify/jwt';

const fastify = Fastify({ logger: true });

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecretkey',
});

fastify.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

fastify.register(userRoutes, { prefix: '/api/users' });

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.log("error");
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 API çalışıyor: ${address}`);
});
