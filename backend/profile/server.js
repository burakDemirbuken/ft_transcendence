import Fastify from 'fastify'
import gamedataRoute from './routes/gamedata.js'
import checkachievement from './plugins/checkachievement.js'
import profileRoute from './routes/profile.js'
import dbPlugin from './plugins/db.js'
import overview from 'fastify-overview'

const fastify = Fastify({
  logger: true,
})

fastify.register(overview)
fastify.register(dbPlugin)
fastify.register(checkachievement)
fastify.register(gamedataRoute)
fastify.register(profileRoute)

await fastify.ready()

try {
  const address = await fastify.listen({ port: 3006, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

/*
  # Aynı network’te misiniz?
docker network ls
docker network inspect <network-adı> | grep -A2 profile

# Container dinliyor mu?
docker compose ps
docker compose logs profile --tail=100
docker compose exec profile sh -c 'ss -lntp | grep 3006 || netstat -lntp | grep 3006'

şunları denesene ben bituvalet
ben 20:15 de kaçacam
derleyince direkt curl dene kapat o zaman
pushla ben bakarım
okke
kendime pushlarım
okke sen eve gidene kadar bakarım ben
okke
kapatıyom ben livesgare ı
bb O7
*/
