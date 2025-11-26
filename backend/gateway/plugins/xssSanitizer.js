import fp from 'fastify-plugin'
import xss from 'xss'

/**
 * XSS Sanitization Plugin
 * Kullanıcı input'larını XSS saldırılarına karşı temizler
 */
export default fp(async (fastify) => {
	
	// XSS options - daha sıkı güvenlik için
	const xssOptions = {
		whiteList: {}, // Hiçbir HTML tag'ine izin verme
		stripIgnoreTag: true, // Bilinmeyen tag'leri kaldır
		stripIgnoreTagBody: ['script', 'style'], // script ve style içeriğini tamamen kaldır
	}

	/**
	 * String değeri XSS'e karşı temizle
	 */
	function sanitizeString(value) {
		if (typeof value !== 'string') return value
		return xss(value, xssOptions)
	}

	/**
	 * Object'in tüm string property'lerini temizle
	 */
	function sanitizeObject(obj) {
		if (!obj || typeof obj !== 'object') return obj
		
		if (Array.isArray(obj)) {
			return obj.map(item => sanitizeValue(item))
		}
		
		const sanitized = {}
		for (const [key, value] of Object.entries(obj)) {
			sanitized[key] = sanitizeValue(value)
		}
		return sanitized
	}

	/**
	 * Herhangi bir değeri temizle (recursive)
	 */
	function sanitizeValue(value) {
		if (value === null || value === undefined) return value
		if (typeof value === 'string') return sanitizeString(value)
		if (typeof value === 'object') return sanitizeObject(value)
		return value
	}

	/**
	 * Request body'yi temizle
	 */
	function sanitizeRequestBody(request) {
		if (request.body && typeof request.body === 'object') {
			request.body = sanitizeObject(request.body)
		}
	}

	/**
	 * Query parametrelerini temizle
	 */
	function sanitizeQueryParams(request) {
		if (request.query && typeof request.query === 'object') {
			request.query = sanitizeObject(request.query)
		}
	}

	// Fastify'a decorate et
	fastify.decorate('sanitizeString', sanitizeString)
	fastify.decorate('sanitizeObject', sanitizeObject)
	fastify.decorate('sanitizeValue', sanitizeValue)
	fastify.decorate('sanitizeRequestBody', sanitizeRequestBody)
	fastify.decorate('sanitizeQueryParams', sanitizeQueryParams)

	// Global hook - tüm request'leri otomatik temizle
	fastify.addHook('preHandler', async (request, reply) => {
		// Body ve query'leri otomatik temizle
		sanitizeRequestBody(request)
		sanitizeQueryParams(request)
	})
})
