import 'dotenv/config'

async function attemptTokenRefresh(fastify, request, reply, refreshToken) {
    try
	{
        const refreshDecoded = fastify.jwt.verify(refreshToken);
        
        if (refreshDecoded.type !== 'refresh') {
            return false;
        }

        const newAccessToken = fastify.jwt.sign(
        {
            userId: refreshDecoded.userId,
            username: refreshDecoded.username,
            email: refreshDecoded.email || '',
            type: 'access'
        },
        {
			expiresIn: '4h'
        });

        const decoded = fastify.jwt.verify(newAccessToken);
        request.user = decoded;
        
        reply.setCookie('accessToken', newAccessToken,
		{
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
            path: '/',
        });
        
        return true;
    }
    catch (error)
    {
        return false;
    }
}

async function verifyJWT(fastify, request, reply) {
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
                    return reply.code(401).send({ success: false, error: 'Token has been invalidated', code: 'BLACKLISTED_TOKEN' });
                }
            }
        }
        catch (blacklistError)
        {
        }

        try
        {
            const decoded = fastify.jwt.verify(token);
            request.user = decoded;
            return;
        }
        catch (err)
        {
            if (err.message.includes('expired') || err.code === 'FAST_JWT_EXPIRED') {
            } else if (err.message.includes('invalid') || err.code === 'FAST_JWT_INVALID_SIGNATURE') {
            } else {
            }

            const refreshToken = request.cookies.refreshToken;
            if (refreshToken)
            {
                try
                {
                    const refreshSuccess = attemptTokenRefresh(fastify, request, reply, refreshToken);
                    if (refreshSuccess) {
                        return;
                    }
                    
                    reply.clearCookie('accessToken', { path: '/', httpOnly: true, secure: true, sameSite: 'Lax' });
                    reply.clearCookie('refreshToken', { path: '/', httpOnly: true, secure: true, sameSite: 'Lax' });
                    reply.clearCookie('authStatus', { path: '/', secure: true, sameSite: 'Lax' });

                    if (!fastify.isPublicPath(requestPath)) {
                        return reply.code(401).send({
                            success: false,
                            error: 'Session expired. Please login again.',
                            code: 'LOGIN_REQUIRED',
                            logout: true
                        });
                    }
                }
                catch (refreshErr)
                {
                    if (refreshErr.message.includes('expired') || refreshErr.code === 'FAST_JWT_EXPIRED') {
                    } else {
                    }
                    
                    reply.clearCookie('accessToken', { path: '/', httpOnly: true, secure: true, sameSite: 'Lax' });
                    reply.clearCookie('refreshToken', { path: '/', httpOnly: true, secure: true, sameSite: 'Lax' });
                    reply.clearCookie('authStatus', { path: '/', secure: true, sameSite: 'Lax' });

                    if (!fastify.isPublicPath(requestPath)) {
                        return reply.code(401).send({
                            success: false,
                            error: 'Session expired. Please login again.',
                            code: 'LOGIN_REQUIRED',
                            logout: true
                        });
                    }
                }
            }
            else
            {
                reply.clearCookie('accessToken', { path: '/', httpOnly: true, secure: true, sameSite: 'Lax' });
                reply.clearCookie('authStatus', { path: '/', secure: true, sameSite: 'Lax' });

                if (!fastify.isPublicPath(requestPath)) {
                    return reply.code(401).send({
                        success: false,
                        error: 'Session expired. Please login again.',
                        code: 'LOGIN_REQUIRED',
                        logout: true
                    });
                }
            }
        }
    }
    else
    {
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
}

export { attemptTokenRefresh, verifyJWT };


