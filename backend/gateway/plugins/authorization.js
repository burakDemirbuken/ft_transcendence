import fp from 'fastify-plugin'

async function jwtMiddleware(fastify, options)
{
    fastify.addHook('preHandler', async (request, reply) =>
    {
        const requestPath = request.url.split('?')[0];
        const token = request.cookies.accessToken;
        if (token)
        {
            try
            {
                request.user = await request.jwtVerify();
                return;
            }
            catch (err)
            {
                if (fastify.isPublicPath(requestPath))
                    return;
                else
                    return ( reply.code(401).send({ success: false, error: 'Invalid authentication token', code: 'INVALID_TOKEN' }) );
            }
        }
        else
        {
            if (fastify.isPublicPath(requestPath))
                return;
            else
                return (reply.code(401).send({ success: false, error: 'Authentication required', code: 'NO_TOKEN'}) );
        }
    });

    fastify.decorate('getUser', function(request)
    {
        return request.user || null;
    });
}

export default fp(jwtMiddleware,{ name: 'jwt-middleware', fastify: '4.x', dependencies: ['@fastify/jwt', '@fastify/cookie'] });
