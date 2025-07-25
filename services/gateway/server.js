import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import proxy from '@fastify/http-proxy'
import path from 'path'
import { fileURLToPath } from 'url'

// ENV yükle
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({ logger: true })

// CORS: Frontend adresin neyse ona göre ayarla (Docker'da domain veya container adı olabilir)
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
})

// Cookie ve JWT ayarları
await fastify.register(cookie)
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET,
  cookie: {
    cookieName: 'accessToken',
    signed: false,
  },
})

// JWT Doğrulama middleware’i
await fastify.register(import('./plugins/jwtVerify.js'))

// Proxy yönlendirmeleri
await fastify.register(import('./routes/index.js'))

// Server'ı başlat
fastify.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
