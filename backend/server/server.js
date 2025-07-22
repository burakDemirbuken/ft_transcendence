import 'dotenv/config';
import Fastify from 'fastify';
import userRoutes from './routes/userRoutes.js';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { setFastifyInstance, isAccessTokenBlacklisted } from './controllers/userController.js';

const fastify = Fastify({ logger: true });

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecretkey',
});

// Cookie plugin'ini register et
fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || 'cookiesecretkey123',
  parseOptions: {}
});

// Controller'a fastify instance'ını geçir
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
