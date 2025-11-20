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
		const userName = fastify.getDataFromToken(request).username ?? null
		if (!userName) {
			throw new Error("userName is required")
		}
		const data = await request.file()

		if (!data) {
			return reply.code(400).send({ message: "No file uploaded" })
		} else if (!allowedMimeTypes.includes(data.mimetype)) {
			await data.file.resume()
			return reply.code(400).send({ message: "Invalid file type" })
		}

		const randomNamefromFileName = await fastify.renameFile(data.filename)

		const filePath = fastify.cwd + `/database/avatars/${randomNamefromFileName}`

		await pipeline(data.file, fs.createWriteStream(filePath))

		const response = await fetch('http://profile:3006/internal/avatar-update', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				avatarUrlPath: 'database/avatars/' + randomNamefromFileName,
				userName: userName
			})
		})
		if (!response.ok) {
			return reply.code(500).send({ message: "Failed to update avatar in profile service" })
		}
		const responseJson = await response.json()

		console.log("Avatar updated successfully for user:", responseJson.newAvatarUrl);
		return reply.code(200).send({ newAvatarUrl: responseJson.newAvatarUrl  })
	})
}
