import      User                    from    '../models/User.js';
import  {   getTranslations     }   from    '../I18n/I18n.js';
import      utils                   from    './utils.js';

async function register(request, reply)
{
    const trlt = getTranslations(request.query.lang || "eng");
    try
    {
        const { username, email, password } = request.body;
        if (!username || !email || !password)
            return (reply.status(400).send({ success: false, error: trlt.register.empty }));
        const existingUser = await User.findByEmail(email) || await User.findByUsername(username);
        if (existingUser)
            return (reply.status(409).send({ success: false, error: trlt.register.taken }));
        const newUser = await User.create({
            username,
            email: email.toLowerCase(),
            password,
            is_active: false
        });
        // Test email'leri için email doğrulama atla
        const isTestEmail = email.endsWith('@test.com');

        if (isTestEmail) {
            // Test kullanıcısı - direkt aktif yap
            newUser.is_active = true;
            await newUser.save();

            // Profile servisi çağır
            try {
                await fetch('http://profile:3006/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userName: newUser.username,
                    })
                });
            } catch (profileError) {
                console.log('Profile service error:', profileError);
            }

            return (reply.status(201).send({
                success: true,
                message: 'Test user created successfully - ready to login',
                user: newUser.toSafeObject(),
                next_step: 'ready_to_login'
            }));
        }

        // Normal kullanıcı - email doğrulama gerekli
        const verificationToken = utils.storeVerificationToken(email, 'email_verification');

        // Email gönderimini background'da yap - response'u bloklama
        utils.sendVerificationEmail(email, username, verificationToken)
            .then(() => {
                console.log(`✅ Verification email sent to: ${email}`);
            })
            .catch((emailError) => {
                console.log(`❌ Failed to send verification email to ${email}:`, emailError);
                // Email gönderilemezse user'ı sil
                User.destroy({ where: { id: newUser.id } }).catch(console.error);
                utils.tempStorage.delete(email);
            });

        // Hemen response dön - email gönderimini bekleme
        return (reply.status(201).send({
            success: true,
            message: trlt.register.success,
            user: newUser.toSafeObject(),
            next_step: 'email_verification'
        }));
    } catch (error)
    {
        console.log('Register error:', error);
        return (reply.status(500).send({ success: false, error: trlt.register.system }));
    }
}


async function login(request, reply) {
    const trlt = getTranslations(request.query.lang || "eng");
    try {
        try {
            await request.jwtVerify();
            return (reply.status(400).send({ success: false, error: trlt.login.already }));
        } catch (err) {
            // Continue with login
        }
        const { login, password } = request.body;
        if (!login || !password)
            return (reply.status(400).send({ success: false, error: trlt.login.empty }));
        const user = await User.findByEmail(login) || await User.findByUsername(login);
        if (!user)
            return (reply.status(401).send({ success: false, error: trlt.login.invalid }));
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword)
            return (reply.status(401).send({ success: false, error: trlt.login.invalid }));
        if (!user.is_active)
            return (reply.status(403).send({ success: false, error: trlt.login.notverified }));

        // 2FA kodu oluştur (hem normal hem test kullanıcı için)
        const isTestUser = user.email.endsWith('@test.com');
        const twoFACode = isTestUser ? '123123' : utils.storeVerificationCode(user.email, { type: '2fa' });
        const userIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress || 'Unknown';

        // Test kullanıcıları için email gönderme - asenkron
        if (!isTestUser) {
            utils.send2FAEmail(user.email, user.username, twoFACode, userIP)
                .then(() => {
                    console.log(`✅ 2FA email sent to: ${user.email}`);
                })
                .catch((emailError) => {
                    console.log(`❌ Failed to send 2FA email to ${user.email}:`, emailError);
                });
        }

        // Test kullanıcıları için store et
        if (isTestUser) {
            const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika
            utils.tempStorage.set(user.email, {
                code: twoFACode,
                expires,
                type: '2fa'
            });
        }
        const message = isTestUser ?
            `${trlt.login.verify} (Test code: 123123)` :
            trlt.login.verify;
        return (reply.send({ success: true, message, next_step: '2fa_verification', email: user.email }));
    } catch (error) {
        console.log('Login error:', error);
        return (reply.status(500).send({ success: false, error: trlt.login.system }));
    }
}


export async function verifyEmail(request, reply)
{
    const trlt = getTranslations(request.query.lang || "eng");
    try
    {
        const token = request.query.token;
        if (!token)
            return (reply.status(400).send({ success: false, error: trlt.token.notFound }));
        let storedData = null;
        let userEmail = null;
        for (const [emailKey, data] of utils.tempStorage.entries())
        {
            if (data.token === token && data.type === 'email_verification')
            {
                storedData = data;
                userEmail = emailKey;
                break;
            }
        }
        if (!storedData)
            return (reply.status(400).send({ success: false, error: trlt.token.expired }));
        if (storedData.expires < new Date()) {
            utils.tempStorage.delete(userEmail);
            return (reply.status(400).send({ success: false, error: trlt.token.expired }));
        }
        const user = await User.findByEmail(userEmail);
        if (!user)
            return (reply.status(404).send({ success: false, error: trlt.unotFound }));
        user.is_active = true;
        await user.save();
        utils.tempStorage.delete(userEmail);
        try {
            await fetch('http://profile:3006/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: user.username,
                })
            });
        } catch (profileError) {
            console.log('Profile service error:', profileError);
        }
        if (request.method === 'GET') {
            return (reply.type('text/html; charset=utf-8').send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Email Doğrulandı - Transcendence</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px;
                               background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
                        .container { background: white; padding: 30px; border-radius: 10px;
                                    max-width: 400px; margin: 0 auto; }
                        h1 { color: #2e7d32; }
                        .btn { background: #1976d2; color: white; padding: 10px 20px;
                              text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🎉 Email Doğrulandı!</h1>
                        <p><strong>${user.username}</strong></p>
                        <p>Email adresiniz doğrulandı. Giriş yapabilirsiniz.</p>
                        <a href="https://${process.env.HOST_IP}:3030/login" class="btn">Giriş Yap</a>
                    </div>
                    <script>setTimeout(() => window.location.href = 'https://${process.env.HOST_IP}:3030/login', 5000);</script>
                </body>
                </html>
            `));
        } else {
            return (reply.send({ success: true, message: trlt.verify.success, user: user.toSafeObject() }));
        }
    } catch (error) {
        console.log('Email verification error:', error);
        return (reply.status(500).send({ success: false, error: trlt.verify.system }));
    }
}
async function verify2FA(request, reply) {
    const trlt = getTranslations(request.query.lang || "eng");
    try {
        const { login, code, rememberMe } = request.body;
        if (!login || !code)
            return (reply.status(400).send({ success: false, error: trlt.verify2FA.empty }));
        const user = await User.findByEmail(login) || await User.findByUsername(login);
        if (!user)
            return (reply.status(404).send({ success: false, error: trlt.unotFound }));
        // Test kullanıcıları için özel kod kontrolü
        const isTestUser = user.email.endsWith('@test.com');

        if (isTestUser && code === '123123') {
            // Test kullanıcısı ve özel kod - direkt geç
            console.log(`Test user ${user.username} using special code 4152`);
        } else {
            // Normal kullanıcı - normal kod kontrolü
            const storedData = utils.tempStorage.get(user.email);
            if (!storedData || storedData.type !== '2fa')
                return (reply.status(400).send({ success: false, error: trlt.verify2FA.expired }));
            if (storedData.expires < new Date()) {
                utils.tempStorage.delete(user.email);
                return (reply.status(400).send({ success: false, error: trlt.verify2FA.expired }));
            }
            if (storedData.code !== code)
                return (reply.status(400).send({ success: false, error: trlt.verify2FA.invalid }));
        }
        await user.markLogin();

        console.log("Creating JWT token for user:", {
            id: user.id,
            username: user.username,
            email: user.email
        });

        const accessToken = await reply.jwtSign(
            { userId: user.id, username: user.username, email: user.email, type: 'access' },
            { expiresIn: '15m' }
        );
        const refreshExpiry = rememberMe ? '30d' : '7d';
        const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        const refreshToken = await reply.jwtSign(
            {
                userId: user.id,
                username: user.username,
                type: 'refresh',
                rememberMe: !!rememberMe,
                issuedAt: Math.floor(Date.now() / 1000)
            },
            { expiresIn: refreshExpiry }
        );
        console.log('🍪 Setting accessToken cookie:', accessToken.substring(0, 20) + '...');
        reply.setCookie('accessToken', accessToken, {
            httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 24 * 60 * 60 * 1000
        });
        console.log('🍪 Setting refreshToken cookie');
        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: refreshMaxAge
        });
        // JavaScript erişimi için ayrı cookie (daha kısa sürede expire olan)
        console.log('🍪 Setting authStatus cookie');
        reply.setCookie('authStatus', 'authenticated', {
            httpOnly: false, secure: true, sameSite: 'Lax', path: '/', maxAge: 24 * 60 * 60 * 1000
        });
        // Profile servisi çağrısı - ilk login'de profil oluştur
        try {
            await fetch('http://profile:3006/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: user.username,
                })
            });
            console.log(`Profile created for user: ${user.username}`);
        } catch (profileError) {
            console.log('Profile service error during 2FA verification:', profileError);
        }

        utils.tempStorage.delete(user.email);
        const userIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress || 'Unknown';

        // Test kullanıcıları için login notification gönderme - asenkron
        if (!isTestUser) {
            utils.sendLoginNotification(user.email, user.username, userIP)
                .then(() => {
                    console.log(`✅ Login notification sent to: ${user.email}`);
                })
                .catch((emailError) => {
                    console.log(`❌ Failed to send login notification to ${user.email}:`, emailError);
                });
        }
        reply.send({
            success: true,
            message: trlt.login.success,
            user: user.toSafeObject(),
            accessToken: accessToken
        });
    } catch (error) {
        console.log('2FA verification error:', error);
        return (reply.status(500).send({ success: false, error: trlt.verify2FA.system }));
    }
}

async function logout(request, reply)
{
	const trlt = getTranslations(request.query.lang || "eng");
	try
	{
		let username;

		// Cookie'den JWT token'ı çek ve decode et
		const cookieToken = request.cookies?.accessToken;
		if (cookieToken) {
			try {
				const decoded = request.server.jwt.verify(cookieToken);
				username = decoded.username;
			} catch (error) {
				console.log('JWT token decode error:', error);
			}
		}

	    reply.clearCookie('accessToken',
        {
			httpOnly: true, secure: true, sameSite: 'Lax', path: '/'
		});
		reply.clearCookie('refreshToken',
        {
			httpOnly: true, secure: true, sameSite: 'Lax', path: '/'
		});
		reply.clearCookie('authStatus',
        {
			httpOnly: true, secure: true, sameSite: 'Lax', path: '/'
		});
		reply.send({
			success: true,
			message: trlt.logout.success,
			user: username
		});
	}
	catch (error)
	{
		reply.status(500).send({ success: false, error: trlt.logout.fail });
	}
}


async function refreshToken(request, reply)
{
    try
    {
        const oldRefreshToken = request.cookies.refreshToken;
        if (!oldRefreshToken)
        {
            return (reply.status(401).send({
                success: false,
                error: 'No refresh token provided',
                code: 'NO_REFRESH_TOKEN'
            }));
        }
        let decoded;
        try
        {
            decoded = request.server.jwt.verify(oldRefreshToken);
        }
        catch (err)
        {
            return (reply.status(401).send({
                success: false,
                error: 'Invalid refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            }));
        }
        if (decoded.type !== 'refresh')
        {
            return (reply.status(401).send({
                success: false,
                error: 'Invalid token type',
                code: 'INVALID_TOKEN_TYPE'
            }));
        }
        const user = await User.findByPk(decoded.userId);
        if (!user)
        {
            return (reply.status(401).send({
                success: false,
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            }));
        }
        const newAccessToken = await reply.jwtSign(
            {
                userId: user.id,
                username: user.username,
                email: user.email,
                type: 'access'
            },
            {
                expiresIn: '15m'
            }
        );
        utils.blacklistToken(oldRefreshToken);
        const now = Math.floor(Date.now() / 1000);
        const remainingTime = decoded.exp - now;
        const remainingDays = Math.max(1, Math.ceil(remainingTime / (24 * 60 * 60)));
        const isRememberMe = decoded.rememberMe || false;
        const maxAllowedDays = isRememberMe ? 30 : 7;
        const newRefreshExpiry = Math.min(remainingDays, maxAllowedDays);
        const newRefreshMaxAge = newRefreshExpiry * 24 * 60 * 60 * 1000;
        const newRefreshToken = await reply.jwtSign(
            {
                userId: user.id,
                username: user.username,
                type: 'refresh',
                rememberMe: isRememberMe,
                issuedAt: now
            },
            { expiresIn: `${newRefreshExpiry}d` }
        );
        reply.setCookie('accessToken', newAccessToken, {
            httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 24 * 60 * 60 * 1000
        });
        reply.setCookie('refreshToken', newRefreshToken, {
            httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: newRefreshMaxAge
        });
        reply.send({
            success: true,
            message: 'Tokens refreshed successfully',
            user: user.toSafeObject(),
            tokenInfo: {
                accessTokenExpiry: '15m',
                refreshTokenExpiry: `${newRefreshExpiry}d`,
                rememberMe: isRememberMe
            }
        });
    }
    catch (error)
    {
        console.log('Refresh token error:', error);
        reply.status(500).send({
            success: false,
            error: 'Internal server error'
        });
    }
}


async function checkTokenBlacklist(request, reply) {
    try
    {
        const { token } = request.body;
        const blacklisted = utils.isTokenBlacklisted(token);
        return (reply.send
        ({
            success: true,
            isBlacklisted: blacklisted
        }));
    }
    catch (error)
    {
        console.log('Token blacklist check error:', error);
        return (reply.status(500).send
        ({
            success: false,
            error: 'Failed to check token status'
        }));
    }
}
async function autoRefreshToken(request, reply)
{
	try
	{
		const accessToken = request.cookies.accessToken;
		const refreshToken = request.cookies.refreshToken;
		let needsRefresh = false;
		let currentUser = null;
		if (!accessToken)
			needsRefresh = true;
		else
		{
			try
			{
				const decoded = request.server.jwt.verify(accessToken);
				if (decoded.type === 'access')
				{
					currentUser = await User.findByPk(decoded.userId);
					return (reply.send({
						success: true,
						action: 'no_refresh_needed',
						user: currentUser?.toSafeObject()
					}));
				}
			}
			catch (err)
			{
				needsRefresh = true;
			}
		}
		if (needsRefresh && refreshToken)
		{
			try
			{
				const decoded = request.server.jwt.verify(refreshToken);
				if (decoded.type === 'refresh' && !utils.isTokenBlacklisted(refreshToken))
					return (await this.refreshToken(request, reply));
			}
			catch (err)
			{
			}
		}
		return (reply.status(401).send({
			success: false,
			action: 'login_required',
			error: 'Authentication required'
		}));
	}
	catch (error)
	{
		return (reply.status(500).send({
			success: false,
			error: 'Token refresh failed'
		}));
	}
}
async function blacklistTokens(request, reply)
{
	try
	{
		const { accessToken, refreshToken } = request.body;
		let blacklistedCount = 0;
		if (accessToken)
		{
			utils.blacklistToken(accessToken);
			blacklistedCount++;
		}
		if (refreshToken)
		{
			utils.blacklistToken(refreshToken);
			blacklistedCount++;
		}
		return (reply.send({
			success: true,
			message: `${blacklistedCount} tokens blacklisted`,
			blacklistedCount: blacklistedCount
		}));
	}
	catch (error)
	{
		return (reply.status(500).send({
			success: false,
			error: 'Failed to blacklist tokens'
		}));
	}
}

// ============================================
// ŞİFRE DEĞİŞTİRME - 2FA İLE
// ============================================

/**
 * Adım 1: Şifre değiştirme isteği - 2FA kodu gönder
 * Body: { currentPassword, newPassword }
 * Response: { success: true, message: "2FA kodu email'inize gönderildi" }
 */
async function initPasswordChange(request, reply) {
	try {
		const { currentPassword, newPassword } = request.body;

		if (!currentPassword || !newPassword) {
			return reply.status(400).send({
				success: false,
				error: 'Current password and new password are required'
			});
		}

		// Yeni şifre validasyonu
		if (newPassword.length < 6) {
			return reply.status(400).send({
				success: false,
				error: 'New password must be at least 6 characters'
			});
		}

		// JWT'den kullanıcıyı al
		const cookieToken = request.cookies?.accessToken;
		const headerToken = request.headers?.authorization?.replace('Bearer ', '');
		const token = cookieToken || headerToken;

		if (!token) {
			return reply.status(401).send({
				success: false,
				error: 'Authentication required'
			});
		}

		const decoded = request.server.jwt.verify(token);
		const user = await User.findByPk(decoded.userId);

		if (!user) {
			return reply.status(404).send({
				success: false,
				error: 'User not found'
			});
		}

		// Mevcut şifreyi kontrol et
		const isPasswordValid = await user.validatePassword(currentPassword);
		if (!isPasswordValid) {
			return reply.status(400).send({
				success: false,
				error: 'Current password is incorrect'
			});
		}

		// 6 haneli 2FA kodu oluştur ve sakla
		const code = utils.storeVerificationCode(user.email, {
			type: 'password_change',
			newPassword: newPassword,
			userId: user.id
		});

		// Email'e 2FA kodunu gönder
		try {
			await utils.send2FAEmail(user.email, user.username, code);
			
			return reply.send({
				success: true,
				message: '2FA code sent to your email',
				expiresIn: '10 minutes'
			});
		} catch (emailError) {
			console.error('Failed to send 2FA email:', emailError);
			utils.tempStorage.delete(user.email);
			return reply.status(500).send({
				success: false,
				error: 'Failed to send verification code'
			});
		}

	} catch (error) {
		console.error('Init password change error:', error);
		return reply.status(500).send({
			success: false,
			error: 'Internal server error'
		});
	}
}

/**
 * Adım 2: 2FA kodunu doğrula ve şifreyi değiştir
 * Body: { code }
 * Response: { success: true, message: "Password changed successfully" }
 */
async function confirmPasswordChange(request, reply) {
	try {
		const { code } = request.body;

		if (!code) {
			return reply.status(400).send({
				success: false,
				error: 'Verification code is required'
			});
		}

		// JWT'den kullanıcıyı al
		const cookieToken = request.cookies?.accessToken;
		const headerToken = request.headers?.authorization?.replace('Bearer ', '');
		const token = cookieToken || headerToken;

		if (!token) {
			return reply.status(401).send({
				success: false,
				error: 'Authentication required'
			});
		}

		const decoded = request.server.jwt.verify(token);
		const user = await User.findByPk(decoded.userId);

		if (!user) {
			return reply.status(404).send({
				success: false,
				error: 'User not found'
			});
		}

		// 2FA kodunu kontrol et
		const storedData = utils.tempStorage.get(user.email);
		
		if (!storedData || storedData.type !== 'password_change') {
			return reply.status(400).send({
				success: false,
				error: 'No pending password change request'
			});
		}

		if (storedData.code !== code) {
			return reply.status(400).send({
				success: false,
				error: 'Invalid verification code'
			});
		}

		if (storedData.expires < new Date()) {
			utils.tempStorage.delete(user.email);
			return reply.status(400).send({
				success: false,
				error: 'Verification code has expired'
			});
		}

		// Şifreyi değiştir
		user.password = storedData.newPassword;
		await user.save();

		// Temp storage'ı temizle
		utils.tempStorage.delete(user.email);

		// Kullanıcının refresh token'ını temizle (güvenlik için)
		await user.clearRefreshToken();

		// Cookie'leri temizle - kullanıcıyı logout yap
		reply.clearCookie('accessToken', { 
			path: '/', 
			httpOnly: true, 
			secure: true, 
			sameSite: 'lax' 
		});
		reply.clearCookie('refreshToken', { 
			path: '/', 
			httpOnly: true, 
			secure: true, 
			sameSite: 'lax' 
		});
		reply.clearCookie('authStatus', { 
			path: '/', 
			secure: true, 
			sameSite: 'lax' 
		});

		return reply.send({
			success: true,
			message: 'Password changed successfully',
			logout: true  // Frontend'e logout olduğunu bildir
		});

	} catch (error) {
		console.error('Confirm password change error:', error);
		return reply.status(500).send({
			success: false,
			error: 'Internal server error'
		});
	}
}

export default {
    register,
    login,
    verifyEmail,
    verify2FA,
    logout,
    refreshToken,
    checkTokenBlacklist,
    autoRefreshToken,
    blacklistTokens,
    initPasswordChange,
    confirmPasswordChange
};
