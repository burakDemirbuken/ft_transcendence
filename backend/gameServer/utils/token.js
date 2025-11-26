export default function getDataFromToken(request, fastify)
{
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
