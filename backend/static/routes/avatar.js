export default async function avatarRoutes(fastify) {
    fastify.get("/default", async (request, reply) => {
        return reply.sendFile(`default.png`)
    })

    fastify.get("/avatar/:fileName", async (request, reply) => { //queryde olabilir ama queryde cache olabilir
        const { fileName } = request.params
        const path = path.join(fastify.cwd, "uploads", fileName)

        if (!fs.existsSync(path)) {
            return reply.code(404).send({ error: "File not found" })
        }

        return reply.sendFile(fileName)
    })

    fastify.post("/avatar/", async (request, reply) => {

    })

}
