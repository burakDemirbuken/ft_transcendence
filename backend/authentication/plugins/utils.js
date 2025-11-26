import fp from 'fastify-plugin'

export default fp(async (fastify) => {
	async function getDataFromToken(request)
	{
		// Gateway'den gelen x-user-* header'larını öncelikli olarak kullan
		const userIdFromHeader = request.headers['x-user-id']
		const usernameFromHeader = request.headers['x-user-username']

		if (userIdFromHeader && usernameFromHeader) {
			return {
				userId: userIdFromHeader,
				username: usernameFromHeader
			}
		}

		// Header'lar yoksa cookie'den token oku
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
