import Fastify from 'fastify'
import gamedataRoute from './routes/gamedata.js'
import checkachievement from './plugins/checkachievement.js'
import profileRoute from './routes/profile.js'
import dbPlugin from './plugins/db.js'
import overview from 'fastify-overview'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'

const fastify = Fastify({
	logger: false,
})

fastify.register(overview)
fastify.register(dbPlugin)
fastify.register(checkachievement)
fastify.register(gamedataRoute)
fastify.register(profileRoute)
fastify.register(cookie)
fastify.register(jwt, {
	secret: process.env.JWT_SECRET
});
function getDataFromToken(request)
{
	const token = request.cookies.accessToken;
	if (!token)
		return null;
	const decoded = fastify.jwt.verify(token);
	return decoded;
}

fastify.decorate('getDataFromToken', getDataFromToken);


await fastify.ready()

try
{
	const address = await fastify.listen({ port: 3006, host: '0.0.0.0' })
}
catch (err)
{
	fastify.log.error(err)
	process.exit(1)
}
