import Fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import clientConc from './routes/clientConnection.js'
import gameServerConc from './routes/gameServerConnection.js'
import RoomManager  from './models/RoomManager.js'
import utils from './plugins/utils.js'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'


const fastify = Fastify({
	logger: false
})

fastify.decorate('roomManager', new RoomManager())
fastify.register(jwt, {
	secret: process.env.JWT_SECRET
})
fastify.register(cookie)
fastify.register(utils)
fastify.register(fastifyWebsocket)
fastify.register(clientConc)
fastify.register(gameServerConc)

await fastify.ready()


fastify.listen({ port: 3004, host: '0.0.0.0' })
