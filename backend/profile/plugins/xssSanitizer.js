import fp from 'fastify-plugin'

/**
 * XSS Sanitization Plugin (Lightweight - without external dependencies)
 * HTML tag'lerini ve tehlikeli karakterleri temizler
 */
export default fp(async (fastify) => {
	
	/**
	 * String değeri XSS'e karşı temizle
	 * HTML tag'leri ve tehlikeli karakterleri escape eder
	 */
	function sanitizeString(value) {
		if (typeof value !== 'string') return value
		
		// HTML karakterlerini escape et
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#x27;')
			.replace(/\//g, '&#x2F;')
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
		if (request.url !== "/internal/avatar-update")
			sanitizeRequestBody(request)
		sanitizeQueryParams(request)
	})
})
