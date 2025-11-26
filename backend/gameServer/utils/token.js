export default function getDataFromToken(request, fastify)
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
		console.log(`decode: ${JSON.stringify(decoded)}`)
		return decoded
	} catch (err) {
		request.log.error(`Token verification failed: ${err.message}`)
		return null
	}
}
