import 'dotenv/config';
import Fastify from 'fastify';
import userRoutes from './routes/userRoutes.js';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { setFastifyInstance, isAccessTokenBlacklisted } from './controllers/userController.js';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const startServer = async () => {
  const fastify = Fastify({ logger: true });

  // JWT plugin'ini kaydet
  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-here'
  });

  // Cookie plugin'ini kaydet
  await fastify.register(fastifyCookie);

  // Controller'a fastify instance'ını gönder
  setFastifyInstance(fastify);

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      // Access token'ı cookie'den veya header'dan al
      let token = null;

      // Önce cookie'den kontrol et
      if (request.cookies.accessToken) {
        token = request.cookies.accessToken;
      }
      // Cookie yoksa header'dan al
      else if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
        token = request.headers.authorization.substring(7);
      }

      if (!token) {
        return reply.code(401).send({ error: 'Access token bulunamadı' });
      }

      // JWT doğrula
      const decoded = fastify.jwt.verify(token);
      request.user = decoded;

      // Access token'ın memory blacklist'te olup olmadığını kontrol et
      if (isAccessTokenBlacklisted(token)) {
        return reply.code(401).send({ error: 'Access token geçersiz (logout edilmiş)' });
      }
    } catch (err) {
      reply.code(401).send({ error: 'Token geçersiz', detail: err.message });
    }
  });

  fastify.register(userRoutes, { prefix: '/api/users' });

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // Serve static files
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'frontend'),
    prefix: '/',
  });

  // Serve index.html for all other routes (SPA fallback)
  fastify.setNotFoundHandler((request, reply) => {
    reply.sendFile('index.html', path.join(__dirname, 'frontend'));
  });

  fastify.listen({
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  }, (err, address) => {
    if (err) {
      console.log("error");
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`🚀 API çalışıyor: ${address}`);
  });
};

// Start the server
startServer().catch((err) => {
  console.error('Server başlatılamadı:', err);
  process.exit(1);
});
