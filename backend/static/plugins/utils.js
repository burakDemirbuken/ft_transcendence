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
		// Gateway'den gelen header'ları kontrol et (öncelikli)
		const userId = request.headers['x-user-id'];
		const username = request.headers['x-user-username'];
		const email = request.headers['x-user-email'];
		
		if (userId && username) {
			// Gateway zaten token verify etmiş, direkt kullan
			return {
				userId: userId,
				username: username,
				email: email || '',
				role: request.headers['x-user-role'] || null
			};
		}
		
		// Fallback: Cookie'den token oku (direkt erişim için)
		const token = request.cookies.accessToken;
		if (!token)
			return null;
			
		try {
			const decoded = fastify.jwt.verify(token);
			return decoded;
		} catch (err) {
			request.log.error(`Token verification failed: ${err.message}`);
			return null;
		}
	}
	fastify.decorate('getDataFromToken', getDataFromToken)
})
