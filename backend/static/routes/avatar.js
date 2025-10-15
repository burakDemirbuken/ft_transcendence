import fs from "node:fs"
import { pipeline } from "node:stream/promises"

const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"]

export default async function avatarRoutes(fastify) {
    fastify.get("/default", async (request, reply) => {
        return reply.sendFile(`default.png`)
    })

    fastify.get("/avatar/:fileName", async (request, reply) => { 
        const { fileName } = request.params
        const path = fastify.cwd + `/uploads/${fileName}`

        if (!fs.existsSync(path)) {
            return reply.code(404).send({ error: "File not found" })
        }

        return reply.sendFile(fileName)
    })

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

        const data = await request.file()
        if (!data) {
            return reply.code(400).send({ 
                success: false,
                error: "No file uploaded"
            })
        } else if (!allowedMimeTypes.includes(data.mimetype)) {
            //close the file stream
            await data.file.resume()
            return reply.code(400).send({
                error: "Invalid file type"
                success: false
            })
        }

        const filePath = fastify.cwd + `/uploads/${data.filename}`

        await pipeline(data.file, fs.createWriteStream(filePath))

        const response = fetch('http://profile:3006/internal/avatar-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: data.filename,
                avatarUrlPath: 'uplodas/' + data.filename
            })
        })

        return reply.code(200).send({ success: true })
    })
}
