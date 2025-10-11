import fp from 'fastify-plugin'

/**
 * Otomatik token refresh fonksiyonu
 */
async function attemptTokenRefresh(fastify, request, reply, refreshToken) {
    try {
        console.log('🔄 Attempting automatic token refresh...');
        
        // Refresh token'dan user bilgilerini al
        const refreshDecoded = fastify.jwt.verify(refreshToken);
        
        // Yeni access token oluştur
        const newAccessToken = fastify.jwt.sign(
            {
                userId: refreshDecoded.userId,
                username: refreshDecoded.username,
                email: refreshDecoded.email || '',
                type: 'access'
            },
            { expiresIn: '15m' }
        );
        
        // Yeni token'ı verify et ve user bilgilerini set et
        const decoded = fastify.jwt.verify(newAccessToken);
        request.user = decoded;
        
        // Client'a yeni cookie gönder
        reply.setCookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });
        
        console.log('✅ Token refreshed automatically for user:', decoded.username);
        return true;
        
    } catch (error) {
        console.log('❌ Auto refresh error:', error.message);
        return false;
    }
}

async function jwtMiddleware(fastify, options) {
    fastify.addHook('preHandler', async (request, reply) => {
        const requestPath = request.url.split('?')[0];
        
        // 1. ÖNCE JWT kontrol et (cookie'de token var mı?)
        const token = request.cookies.accessToken;
        
        if (token) {
            // Token var, verify et
            try {
                // 2. JWT verify et - cookie'den token'ı manual verify
                console.log('🔍 Attempting JWT verify for token:', token.substring(0, 20) + '...');
                const decoded = fastify.jwt.verify(token);
                request.user = decoded;
                console.log('✅ JWT verified for user:', request.user.username, 'ID:', request.user.userId);
                // Token geçerli, devam et
                return;
            } catch (err) {
                console.log('❌ Access token verification failed:', err.message);
                
                // Access token geçersiz, refresh token var mı kontrol et ve otomatik yenile
                const refreshToken = request.cookies.refreshToken;
                if (refreshToken) {
                    try {
                        const refreshDecoded = fastify.jwt.verify(refreshToken);
                        if (refreshDecoded.type === 'refresh') {
                            console.log('🔄 Access token expired, attempting automatic refresh...');
                            
                            // Otomatik refresh token ile yeni access token al
                            const refreshSuccess = await attemptTokenRefresh(fastify, request, reply, refreshToken);
                            if (refreshSuccess) {
                                console.log('✅ Token refreshed automatically, continuing request');
                                return; // Yeni token ile devam et
                            } else {
                                console.log('❌ Auto refresh failed');
                            }
                        }
                    } catch (refreshErr) {
                        console.log('❌ Refresh token also invalid:', refreshErr.message);
                    }
                }
                
                // 3. Verify başarısız, public path mi kontrol et
                if (fastify.isPublicPath(requestPath)) {
                    // Public path, token geçersiz olsa da geçir
                    console.log('✅ Public path, allowing access despite invalid token');
                    return;
                } else {
                    // Protected path ve token geçersiz
                    console.log('❌ Protected path with invalid token, denying access');
                    return reply.code(401).send({ 
                        success: false, 
                        error: 'Invalid authentication token', 
                        code: 'INVALID_TOKEN' 
                    });
                }
            }
        } else {
            // Token yok, public path mi kontrol et
            console.log('⚠️  No token found for:', requestPath);
            if (fastify.isPublicPath(requestPath)) {
                // Public path, token olmasa da geçir
                console.log('✅ Public path, allowing access without token');
                return;
            } else {
                // Protected path ve token yok
                console.log('❌ Protected path without token, denying access');
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
