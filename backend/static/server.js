import Fastify from "fastify"
import fastifyStatic from "@fastify/static"
import fastifyMultipart from "@fastify/multipart"
import path from "path"
import reName from "./plugins/renamer.js"
import avatarRoutes from "./routes/avatar.js"

const __dirname = process.cwd()

const fastify = Fastify({
    logger: true
})

console.log(path.join(__dirname, "database/avatars"))

fastify.register(fastifyStatic, {
    root: path.join(__dirname, "database/avatars"),
    prefix: "/database/avatars/"
})
fastify.register(reName)
fastify.decorate("cwd", __dirname)
fastify.register(fastifyMultipart)
fastify.register(avatarRoutes)

await fastify.ready()

fastify.listen({port: 3008, host: '0.0.0.0'}, (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})
