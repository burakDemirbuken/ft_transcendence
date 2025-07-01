import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import path from 'path';
import { fileURLToPath } from 'url';

const fastify = Fastify({ logger: true });

// Initialize server
async function setup() {
  // WebSocket
  await fastify.register(websocket);
  const clients = new Set();

  fastify.register(async (fastify) => {
    fastify.get('/ws', { websocket: true }, (connection) => {
      console.log('🟢 New WebSocket connection');
      clients.add(connection.socket);

      connection.socket.on('message', (message) => {
        console.log('📨 Message:', message.toString());
        for (const client of clients) client.send(message.toString());
      });

      connection.socket.on('close', () => {
        clients.delete(connection.socket);
        console.log('Client disconnected');
      });
    });
  });

  // Static files (SPA)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
await fastify.register(import('@fastify/static'), {
  root: '/Desktop/trancedere/',
  prefix: '/',
  wildcard: true,       // Allows deep linking
  index: 'index.html',  // Default file to serve
  decorateReply: false  // Important for SPA
});

//   // Fallback to index.html for SPA routing
//   fastify.get('/*', (req, reply) => {
//     reply.sendFile('index.html');
//   });

// fastify.setNotFoundHandler((req, reply) => {
//   reply.sendFile('index.html');
// });

// fastify.get('/', (req, reply) => {
//   reply.sendFile('index.html');
// });

  // Start server
  await fastify.listen({ port: 3000, host: '0.0.0.0' });
  console.log('Server running on http://localhost:3000');
}

setup().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});