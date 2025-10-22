import fs from "node:fs"
import { pipeline } from "node:stream/promises"

const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"]

export default async function avatarRoutes(fastify) {

    fastify.post("/avatar", async (request, reply) => {
        /* 
          const data = await req.file()

            data.file // stream
            data.fields // other parsed parts
            data.fieldname
            data.filename
            data.encoding
            data.mimetype
        */
        const { userName } = request.query ?? {}
        if (!userName) {
            return reply.code(400).send({
                success: false,
                error: "username query parameter is required"
            })
        }
        const data = await request.file()
        if (!data) {
            return reply.code(400).send({ 
                success: false,
                error: "No file uploaded"
            })
        } else if (!allowedMimeTypes.includes(data.mimetype)) {
            await data.file.resume() //?
            return reply.code(400).send({
                error: "Invalid file type",
                success: false
            })
        }

        const filePath = fastify.cwd + `/uploads/${data.filename}`

        await pipeline(data.file, fs.createWriteStream(filePath))

        const response = await fetch('http://profile:3006/internal/avatar-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                avatarUrlPath: 'uploads/' + data.filename,
                userName: userName
            })
        })
        if (!response.ok) {
            return reply.code(500).send({
                success: false,
                error: "Failed to update avatar in profile service"
            })
        }

        return reply.code(200).send({ success: true })
    })
}
