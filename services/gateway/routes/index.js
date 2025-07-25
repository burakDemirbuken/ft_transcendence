import proxy from '@fastify/http-proxy'

export default async function (fastify, opts) {
  // /auth -> authentication service (authentication:3001)
  fastify.register(proxy, {
    upstream: 'http://authentication:3001',
    prefix: '/auth',
    rewritePrefix: '/auth',
  })

  // Ek servis örneği:
  // /user -> user service (user:3002)
  // fastify.register(proxy, {
  //   upstream: 'http://user:3002',
  //   prefix: '/user',
  //   rewritePrefix: '/user',
  // })
}
