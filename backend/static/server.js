import Fastify from "fastify"
import fastifyStatic from "@fastify/static"
import fastifyMultipart from "@fastify/multipart"
import path from "path"
import utils from "./plugins/utils.js"
import avatarRoutes from "./routes/avatar.js"
import jwt from "@fastify/jwt"
import cookie from "@fastify/cookie"

import fs from "fs"

const __dirname = process.cwd()
const avatarDir = path.join(__dirname, "database/avatars")

if (!fs.existsSync(avatarDir)){
    fs.mkdirSync(avatarDir, { recursive: true });
}

const fastify = Fastify({
    logger: true
})

fastify.decorate("cwd", __dirname)
fastify.register(fastifyStatic, {
    root: avatarDir,
    prefix: "/database/avatars/"
})
fastify.register(fastifyMultipart, {
    limits: {
        fileSize: 5 * 1024 * 1024
    }
})
fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "supersecret"
})
fastify.register(cookie)
fastify.register(utils)

console.log(path.join(__dirname, "database/avatars"))

fastify.register(avatarRoutes)

await fastify.ready()

fastify.listen({port: 3008, host: '0.0.0.0'}, (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})
