import fp from 'fastify-plugin'
import crypto from 'crypto'
import path from 'path'

export default fp(async (fastify) => {

	async function renamer(originalName) {
		const timestamp = Date.now()
		const randomId = crypto.randomUUID()
		const extension = path.extname(originalName)
		
		return `${timestamp}-${randomId}${extension}`
	}
	fastify.decorate('renameFile', renamer)

	async function getDataFromToken(request)
	{
		const token = request.cookies.accessToken
		if (!token)
			return null
		try {
			const decoded = fastify.jwt.verify(token)
			return decoded
		} catch (err) {
			request.log.error(`Token verification failed: ${err.message}`)
			return null
		}
	}
	fastify.decorate('getDataFromToken', getDataFromToken)
})
