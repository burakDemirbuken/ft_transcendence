import fp from 'fastify-plugin'

export default fp(async (fastify) => {
	async function getDataFromToken(request)
	{
		const userIdFromHeader = request.headers['x-user-id']
		const usernameFromHeader = request.headers['x-user-username']

		if (userIdFromHeader && usernameFromHeader) {
			return {
				userId: userIdFromHeader,
				username: usernameFromHeader
			}
		}

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
