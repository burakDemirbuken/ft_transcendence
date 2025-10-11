export async function verifyJWT(req, reply){
	try {
		await req.jwtVerify()
	} catch (err) {
		reply.code(401).send({ error: 'Unauthorized' })
	}
}

export async function checkAdmin(req, reply) {
	// check user is admin
}

/* Alternative Fastify plugin approach:
export default async function (fastify, opts) {
  fastify.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })

  fastify.decorate("requireAdmin", async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== 'admin') {
      reply.code(403).send({
        error: 'Access denied. Admin privileges required.'
      });
    }
  })
}
*/