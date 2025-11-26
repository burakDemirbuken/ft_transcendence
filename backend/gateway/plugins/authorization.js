import 'dotenv/config'

// Token refresh fonksiyonu
async function attemptTokenRefresh(fastify, request, reply, refreshToken) {
    try
	{
        console.log('🔄 Attempting to refresh access token...');
        const refreshDecoded = fastify.jwt.verify(refreshToken);
        
        // Refresh token type kontrolü
        if (refreshDecoded.type !== 'refresh') {
            console.log('❌ Token is not a refresh token');
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
			expiresIn: '1m'
        });
        
        const decoded = fastify.jwt.verify(newAccessToken);
        request.user = decoded;
        
        // Set cookie in response
        reply.setCookie('accessToken', newAccessToken,
		{
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
            path: '/',
        });
        
        console.log('✅ Access token refreshed successfully for user:', decoded.username);
        console.log('✅ New token set in cookie header');
        return true;
    }
    catch (error)
    {
        console.log('❌ Auto refresh error:', error.message);
        return false;
    }
}

// Sadece çağırdığınızda çalışan bağımsız fonksiyon
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
            
            // Token expire olmuş veya geçersiz
            if (err.message.includes('expired') || err.code === 'FAST_JWT_EXPIRED') {
                console.log('⏰ Access token expired, attempting refresh...');
            } else if (err.message.includes('invalid') || err.code === 'FAST_JWT_INVALID_SIGNATURE') {
                console.log('🚫 Access token invalid signature');
            } else {
                console.log('🚫 Access token verification failed with error:', err.code || err.message);
            }
            
            const refreshToken = request.cookies.refreshToken;
            if (refreshToken)
            {
                try
                {
                    // Refresh token'ı verify et ve yeni access token al
                    const refreshSuccess = attemptTokenRefresh(fastify, request, reply, refreshToken);
                    if (refreshSuccess) {
                        console.log('✅ Token refreshed automatically, request continues without error');
                        console.log('✅ request.user:', request.user);
                        return; // ← Request devam eder
                    }
                    
                    // Refresh başarısız (muhtemelen expire olmuş)
                    console.log('❌ Auto refresh failed - clearing cookies');
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
                    console.log('❌ Refresh token verification failed:', refreshErr.message);
                    
                    // Refresh token süresi dolmuş veya geçersiz
                    if (refreshErr.message.includes('expired') || refreshErr.code === 'FAST_JWT_EXPIRED') {
                        console.log('⏰ Refresh token expired - session ended');
                    } else {
                        console.log('🚫 Refresh token invalid:', refreshErr.code || refreshErr.message);
                    }
                    
                    // Cookie'leri temizle
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
                // Refresh token yok
                console.log('⚠️  No refresh token available - cannot refresh');
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
}

// Sadece fonksiyonları export et

export { attemptTokenRefresh, verifyJWT };


