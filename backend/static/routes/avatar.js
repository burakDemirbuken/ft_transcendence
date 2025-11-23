import fs from "node:fs"
import { pipeline } from "node:stream/promises"
import path from "path"

const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"]

export default async function avatarRoutes(fastify) {

	fastify.post("/avatar", async (request, reply) => {
		const userName = (await fastify.getDataFromToken(request))?.username ?? null

		if (!userName) {
			return reply.code(401).send({ message: "Unauthorized: username is required" })
		}

		const data = await request.file()

		if (!data) {
			return reply.code(400).send({ message: "No file uploaded" })
		} 

		if (!allowedMimeTypes.includes(data.mimetype)) {
			await data.file.resume()
			return reply.code(415).send({ message: "Unsupported media type. Only JPG/JPEG and PNG are allowed." })
		}

		const randomNamefromFileName = await fastify.renameFile(data.filename)
		const filePath = path.join(fastify.cwd, "database/avatars", randomNamefromFileName);

		try {
			await pipeline(data.file, fs.createWriteStream(filePath))
		} catch (err) {
			request.log.error(`File save failed: ${err.message}`)
			return reply.code(500).send({ message: "Failed to save file" })
		}

		try {
			const response = await fetch('http://profile:3006/internal/avatar-update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					avatarUrlPath: 'database/avatars/' + randomNamefromFileName,
					userName: userName
				})
			})

			if (!response.ok) {
				await fs.promises.unlink(filePath).catch(err => request.log.error(`Failed to delete orphaned file: ${err.message}`))
				return reply.code(502).send({ message: "Upstream profile service rejected avatar update" })
			}

			const responseJson = await response.json()
			request.log.info(`Avatar updated successfully for user: ${userName}`)
			return reply.code(201).send({ newAvatarUrl: responseJson.newAvatarUrl  })

		} catch (err) {
			await fs.promises.unlink(filePath).catch(err => request.log.error(`Failed to delete orphaned file: ${err.message}`))
			request.log.error(`Profile service communication failed: ${err.message}`)
			return reply.code(502).send({ message: "Failed to communicate with profile service" })
		}
	})
}
