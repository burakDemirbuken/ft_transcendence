async function NotFoundHandler(request, reply) {
  reply.status(404).send({
    success: false,
    error: 'Route not found',
    path: request.url,
    service: 'authentication-service'
  });
}

async function InternalServerErrorHandler(error, request, reply) {
  request.log.error(error);
  reply.status(500).send({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
}

export default {
  NotFoundHandler,
  InternalServerErrorHandler
};