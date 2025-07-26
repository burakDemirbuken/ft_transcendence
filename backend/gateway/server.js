import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import authProxy from './routes/authProxy.js'

// ENV yükle
dotenv.config()

const fastify = Fastify({ logger: true })

// CORS: Frontend adresin neyse ona göre ayarla (Docker'da domain veya container adı olabilir)
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
})

// Cookie ve JWT ayarları
await fastify.register(cookie)

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'default_secret',
  cookie: {
    cookieName: 'accessToken',
    signed: false,
  }
})    

// Auth proxy'yi register et - /auth/* isteklerini authentication servisine yönlendir
await fastify.register(authProxy);

fastify.listen({ 
  port: process.env.PORT || 3000, 
  host: process.env.HOST || '0.0.0.0' 
}, (err, address) => {
  if (err) {
    console.log("error");
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 Gateway çalışıyor: ${address}`);
  console.log(`📡 Authentication istekleri için: ${address}/auth/*`);
});