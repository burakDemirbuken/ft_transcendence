import Fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import clientConc from './routes/clientConnection.js'
import gameServerConc from './routes/gameServerConnection.js'
import overview from 'fastify-overview'
import RoomManager  from './models/RoomManager.js'

const fastify = Fastify({
	logger: false
})

//fastify.register(overview)
fastify.decorate('roomManager', new RoomManager())
fastify.register(fastifyWebsocket)
fastify.register(clientConc)
fastify.register(gameServerConc)

await fastify.ready()

//console.log(JSON.stringify(fastify.overview(), null, 2))

fastify.listen({ port: 3004, host: '0.0.0.0' })
