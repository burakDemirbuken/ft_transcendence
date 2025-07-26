export default async function authProxy(fastify, opts) {
  // /auth prefix'i ile gelen tüm istekleri authentication servisine proxy et
  await fastify.register(import('@fastify/http-proxy'), {
    upstream: 'http://authentication:3001',
    prefix: '/auth',
    http2: false
  });
  
  console.log("Auth proxy registered - all /auth/* requests will be forwarded to authentication service");
}
