import fp from 'fastify-plugin'

async function attemptTokenRefresh(fastify, request, reply, refreshToken) {
    try
    {
        const refreshDecoded = fastify.jwt.verify(refreshToken);
        
        if (refreshDecoded.type !== 'refresh')
            return ( false );
 
        const newAccessToken = fastify.jwt.sign({ userId: refreshDecoded.userId, username: refreshDecoded.username, email: refreshDecoded.email || '', type: 'access'},{ expiresIn: '1m'});
        request.user = fastify.jwt.verify(newAccessToken);
        request.newAccessToken = newAccessToken
        reply.setCookie('accessToken', newAccessToken, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/'});
        return ( true );
    }
    catch (error)
    {
        return ( false );
    }
}

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
                request.user = fastify.jwt.verify(token);
                return;
            }
            catch (err)
            {
                const refreshToken = request.cookies.refreshToken;
                if (refreshToken)
                {
                    try
                    {
                        if (attemptTokenRefresh(fastify, request, reply, refreshToken))
                            return;
                        reply.clearCookie('accessToken',    { path: '/', httpOnly: true, secure: true, sameSite: 'Lax' });
                        reply.clearCookie('refreshToken',   { path: '/', httpOnly: true, secure: true, sameSite: 'Lax' });
                        reply.clearCookie('authStatus',     { path: '/', secure: true, sameSite: 'Lax' });
                        if (!fastify.isPublicPath(requestPath))
                            return ( reply.code(401).send({ success: false, error: 'Session expired. Please login again.', code: 'LOGIN_REQUIRED', logout: true }) );
                    }
                    catch (refreshErr)
                    {
                        reply.clearCookie('accessToken',    { path: '/', httpOnly: true, secure: true, sameSite: 'Lax' });
                        reply.clearCookie('refreshToken',   { path: '/', httpOnly: true, secure: true, sameSite: 'Lax' });
                        reply.clearCookie('authStatus',     { path: '/', secure: true, sameSite: 'Lax' });
                        if (!fastify.isPublicPath(requestPath))
                            return ( reply.code(401).send({ success: false, error: 'Session expired. Please login again.', code: 'LOGIN_REQUIRED', logout: true }) );
                    }
                }
                else
                {
                    reply.clearCookie('accessToken', { path: '/', httpOnly: true, secure: true, sameSite: 'Lax' });
                    reply.clearCookie('authStatus', { path: '/', secure: true, sameSite: 'Lax' });
                    if (!fastify.isPublicPath(requestPath))
                        return ( reply.code(401).send({ success: false, error: 'Session expired. Please login again.', code: 'LOGIN_REQUIRED', logout: true }) );
                }
            }
        }
        else
        {
            if (!fastify.isPublicPath(requestPath))
                return ( reply.code(401).send({ success: false, error: 'Authentication required', code: 'NO_TOKEN' }) ) ;
        }
    });
}

export default fp(jwtMiddleware,{ name: 'jwt-middleware', fastify: '4.x', dependencies: ['@fastify/jwt', '@fastify/cookie'] });
