import Fastify from 'fastify';

const gateway = Fastify();

gateway.get('/api/ping', async (request, reply) => {
  return { message: 'pong' };
});

gateway.all('/api/*', async (request, reply) => {
  console.log(`[GATEWAY] ${request.method} ${request.url}`);
  return { message: 'Hello from gateway!' };
});

gateway.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Gateway server listening on ${address}`);
});
