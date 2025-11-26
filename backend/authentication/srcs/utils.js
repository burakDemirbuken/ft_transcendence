async function NotFoundHandler(request, reply)
{
	reply.status(404).send(
	{
		success: false,
		error: 'Route not found',
		path: request.url,
		service: 'authentication-service'
	});
}

async function InternalServerErrorHandler(error, request, reply)
{
	request.log.error(error);
	
	// Schema validation error (Fastify AJV validation)
	if (error.validation) {
		const field = error.validation[0]?.instancePath?.replace('/', '') || error.validation[0]?.params?.missingProperty || 'field';
		const message = error.validation[0]?.message || 'Validation failed';
		
		// Basit ve net: field + orijinal mesaj
		const userFriendlyMessage = field ? `${field}: ${message}` : message;
		
		return reply.status(400).send({
			success: false,
			error: userFriendlyMessage
		});
	}
	
	// Diğer hatalar
	reply.status(error.statusCode || 500).send(
	{
		success: false,
		error: error.statusCode === 500 ? 'Internal server error' : error.message,
		message: error.message
	});
}

export default
{
	NotFoundHandler,
	InternalServerErrorHandler
};