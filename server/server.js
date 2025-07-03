// server.js
const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');

// Create server instance
const server = fastify;

// Serve static files from the 'dist' directory (common SPA output folder)
server.register(require('@fastify/static'), {
  root: path.join(__dirname, '../dist'),
  prefix: '/',
  wildcard: false, // Disable wildcard to handle 404 properly for SPA
});

// SPA fallback route - serve index.html for all other routes
server.setNotFoundHandler((req, reply) => {
  const indexFile = path.join(__dirname, '../dist', 'index.html');

  if (fs.existsSync(indexFile)) {
    reply.type('text/html').send(fs.readFileSync(indexFile));
  } else {
    reply.code(404).send({ error: 'Not Found' });
  }
});

// Start the server
const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    server.log.info(`Server listening on ${server.server.address().port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
