import fp from 'fastify-plugin'

export default fp(async (fastify) => {
	
	function sanitizeString(value) {
		if (typeof value !== 'string') return value
		
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#x27;')
			.replace(/\//g, '&#x2F;')
	}

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

	function sanitizeValue(value) {
		if (value === null || value === undefined) return value
		if (typeof value === 'string') return sanitizeString(value)
		if (typeof value === 'object') return sanitizeObject(value)
		return value
	}

	function sanitizeRequestBody(request) {
		if (request.body && typeof request.body === 'object') {
			request.body = sanitizeObject(request.body)
		}
	}

	function sanitizeQueryParams(request) {
		if (request.query && typeof request.query === 'object') {
			request.query = sanitizeObject(request.query)
		}
	}

	fastify.decorate('sanitizeString', sanitizeString)
	fastify.decorate('sanitizeObject', sanitizeObject)
	fastify.decorate('sanitizeValue', sanitizeValue)
	fastify.decorate('sanitizeRequestBody', sanitizeRequestBody)
	fastify.decorate('sanitizeQueryParams', sanitizeQueryParams)

	fastify.addHook('preHandler', async (request, reply) => {
		if (request.url !== "/internal/avatar-update")
			sanitizeRequestBody(request)
		sanitizeQueryParams(request)
	})
})
