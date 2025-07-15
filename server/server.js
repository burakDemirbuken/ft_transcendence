const fastify = require('fastify')({ logger: true });

// Basit GET endpoint
fastify.get('/ping', async (request, reply) => {
  return { pong: 'it works!' };
});

// Sunucuyu başlat
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log("✅ Fastify çalışıyor: http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
