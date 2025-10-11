import fp from 'fastify-plugin'

async function jwtMiddleware(fastify, options) {
    fastify.addHook('preHandler', async (request, reply) => {
        const requestPath = request.url.split('?')[0];
        
        // 1. ÖNCE JWT kontrol et (cookie'de token var mı?)
        const token = request.cookies.accessToken;
        
        console.log('DEBUG: Token from cookies:', token);
        console.log('DEBUG: Request path:', requestPath);
        
        if (token) {
            // Token var, verify et
            try {
                // 2. JWT verify et
                request.user = await request.jwtVerify();
                console.log('DEBUG: JWT verified successfully for user:', request.user.username);
                // Token geçerli, devam et
                return;
            } catch (err) {
                console.log('DEBUG: JWT verification failed:', err.message);
                // 3. Verify başarısız, public path mi kontrol et
                if (fastify.isPublicPath(requestPath)) {
                    // Public path, token geçersiz olsa da geçir
                    console.log('DEBUG: Public path, allowing access despite invalid token');
                    return;
                } else {
                    // Protected path ve token geçersiz
                    console.log('DEBUG: Protected path with invalid token, denying access');
                    return reply.code(401).send({ 
                        success: false, 
                        error: 'Invalid authentication token', 
                        code: 'INVALID_TOKEN' 
                    });
                }
            }
        } else {
            // Token yok, public path mi kontrol et
            console.log('DEBUG: No token found in request to', requestPath);
            if (fastify.isPublicPath(requestPath)) {
                // Public path, token olmasa da geçir
                console.log('DEBUG: Public path, allowing access without token');
                return;
            } else {
                // Protected path ve token yok
                console.log('DEBUG: Protected path without token, denying access');
                return reply.code(401).send({ 
                    success: false, 
                    error: 'Authentication required', 
                    code: 'NO_TOKEN' 
                });
            }
        }
    });

    fastify.decorate('getUser', function(request) {
        return request.user || null;
    });
}

export default fp(jwtMiddleware,{ name: 'jwt-middleware', fastify: '4.x', dependencies: ['@fastify/jwt', '@fastify/cookie'] });
