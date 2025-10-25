import fp from 'fastify-plugin'


async function attemptTokenRefresh(fastify, request, reply, refreshToken) {
    try
	{
        const refreshDecoded = fastify.jwt.verify(refreshToken);
        const newAccessToken = fastify.jwt.sign(
        {
            userId: refreshDecoded.userId,
            username: refreshDecoded.username,
            email: refreshDecoded.email || '',
            type: 'access'
        },
        {
			expiresIn: '15m'
        });
        const decoded = fastify.jwt.verify(newAccessToken);
        request.user = decoded;
        
        reply.setCookie('accessToken', newAccessToken,
		{
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
            path: '/',
            maxAge: 15 * 60 * 1000
        });
        return ( true );
    }
    catch (error)
    {
        console.log('❌ Auto refresh error:', error.message);
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
                const blacklistResponse = await fetch('http://authentication:3001/check-token-blacklist',
                {
                    method: 'POST',
                    headers:
                    {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token: token })
                });
                
                if (blacklistResponse.ok)
                {
                    const blacklistResult = await blacklistResponse.json();
                    if (blacklistResult.isBlacklisted)
                    {
                        console.log('🚫 Token is blacklisted, denying access');
                        return reply.code(401).send({ success: false, error: 'Token has been invalidated', code: 'BLACKLISTED_TOKEN' });
                    }
                }
            }
			catch (blacklistError)
			{
                console.log('❌ Blacklist check failed:', blacklistError.message);
            }
            
            try
			{
                console.log('🔍 Attempting JWT verify for token:', token.substring(0, 20) + '...');
                const decoded = fastify.jwt.verify(token);
                request.user = decoded;
                console.log('✅ JWT verified for user:', request.user.username, 'ID:', request.user.userId);
                return;
            }
			catch (err)
			{
                console.log('❌ Access token verification failed:', err.message);
                
                const refreshToken = request.cookies.refreshToken;
                if (refreshToken)
				{
                    try
					{
                        const refreshDecoded = fastify.jwt.verify(refreshToken);
                        if (refreshDecoded.type === 'refresh')
						{
                            const refreshSuccess = await attemptTokenRefresh(fastify, request, reply, refreshToken);
                            if (refreshSuccess)
                                return (console.log('✅ Token refreshed automatically, continuing request'));
                             else
                                console.log('❌ Auto refresh failed');
                        }
                    }
					catch (refreshErr)
					{
						console.log('❌ Refresh token verification failed:', refreshErr.message);
                    }
                }
                
                if (fastify.isPublicPath(requestPath))
                    return;
				else
				{
			        return reply.code(401).send(
					{ 
                        success: false, 
                        error: 'Invalid authentication token', 
                        code: 'INVALID_TOKEN' 
                    });
                }
            }
        }
		else
		{
            console.log('⚠️  No token found for:', requestPath);
            if (fastify.isPublicPath(requestPath))
                return;
			else
			{
                return reply.code(401).send({ 
                    success: false, 
                    error: 'Authentication required', 
                    code: 'NO_TOKEN' 
                });
            }
        }
    });

    fastify.decorate('getUser', function(request)
	{
        return ( request.user || null );
    });
}

export default fp(jwtMiddleware,{ name: 'jwt-middleware', fastify: '4.x', dependencies: ['@fastify/jwt', '@fastify/cookie'] });
