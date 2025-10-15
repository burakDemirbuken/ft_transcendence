import Fastify from "fastify"
import fastifyStatic from "fastify-static"
import fastifyMultipart from "@fastify/multipart"
import avatarRoutes from "./routes/avatar.js"
import path from "path"

const fastify = Fastify({
    logger: true
})

fastify.register(fastifyStatic, {
    root: path.join(__dirname, "default"),
    prefix: "/default/",
})

fastify.register(fastifyStatic, {
    root: path.join(__dirname, "uploads"),
    prefix: "/uploads/",
})

fastify.decorate("cwd", process.cwd())
fastify.register(fastifyMultipart)
fastify.register(avatarRoutes)

await fastify.ready()

fastify.listen({port: 3010, host: '0.0.0.0'}, (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})
