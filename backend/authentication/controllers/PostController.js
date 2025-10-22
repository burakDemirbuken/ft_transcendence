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
        const verificationToken = utils.storeVerificationToken(email, 'email_verification');
        try
        {
            await utils.sendVerificationEmail(email, username, verificationToken);

            return (reply.status(201).send({
                success: true,
                message: trlt.register.success,
                user: newUser.toSafeObject(),
                next_step: 'email_verification' 
            }));
        }
        catch (emailError)
        {
            await User.destroy({ where: { id: newUser.id } });
            utils.tempStorage.delete(email);
            return (reply.status(400).send({ success: false, error: trlt.register.fail }));
        }
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
        const twoFACode = utils.storeVerificationCode(user.email, '2fa');
        const userIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress || 'Unknown';
        try {
            await utils.send2FAEmail(user.email, user.username, twoFACode, userIP);
        } catch (emailError) {
            console.log('2FA email error:', emailError);
        }
        return (reply.send({ success: true, message: trlt.login.verify, next_step: '2fa_verification', email: user.email }));
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
        const storedData = utils.tempStorage.get(user.email);
        if (!storedData || storedData.type !== '2fa')
            return (reply.status(400).send({ success: false, error: trlt.verify2FA.expired }));
        if (storedData.expires < new Date()) {
            utils.tempStorage.delete(user.email);
            return (reply.status(400).send({ success: false, error: trlt.verify2FA.expired }));
        }
        if (storedData.code !== code)
            return (reply.status(400).send({ success: false, error: trlt.verify2FA.invalid }));
        await user.markLogin();
        const accessToken = await reply.jwtSign(
            { userId: user.id, username: user.username, email: user.email, type: 'access' },
            { expiresIn: '15m' }
        );
        // Remember me durumuna göre refresh token süresi
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
        // HttpOnly cookie'ler (güvenlik için)
        console.log('🍪 Setting accessToken cookie:', accessToken.substring(0, 20) + '...');
        reply.setCookie('accessToken', accessToken, {
            httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 24 * 60 * 60 * 1000
        });
        console.log('🍪 Setting refreshToken cookie');
        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: refreshMaxAge
        });
        // JavaScript erişimi için ayrı cookie (daha kısa sürede expire olan)
        console.log('🍪 Setting authStatus cookie');
        reply.setCookie('authStatus', 'authenticated', {
            httpOnly: false, secure: true, sameSite: 'none', path: '/', maxAge: 24 * 60 * 60 * 1000
        });
        utils.tempStorage.delete(user.email);
        const userIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress || 'Unknown';
        try {
            await utils.sendLoginNotification(user.email, user.username, userIP);
        } catch (emailError) {
            console.log('Login notification error:', emailError);
        }
        // Response'ta da token'ı gönder (frontend için)
        reply.send({
            success: true,
            message: trlt.login.success,
            user: user.toSafeObject(),
            accessToken: accessToken // Frontend'de localStorage'a kaydedebilmek için
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
		console.log('🚪 Logging out user, clearing all cookies');

		// Tüm auth cookie'lerini temizle
		reply.clearCookie('accessToken', {
			httpOnly: true, secure: true, sameSite: 'none', path: '/'
		});
		reply.clearCookie('refreshToken', {
			httpOnly: true, secure: true, sameSite: 'none', path: '/'
		});
		reply.clearCookie('authStatus', {
			httpOnly: false, secure: true, sameSite: 'none', path: '/'
		});
		console.log('✅ All cookies cleared successfully');
		reply.send({
			success: true,
			message: trlt.logout.success,
			user: request.headers['x-user-username']
		});
	}
	catch (error)
	{
		console.error('❌ Logout error:', error);
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
        const remainingDays = Math.max(1, Math.ceil(remainingTime / (24 * 60 * 60))); // En az 1 gün
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
            httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 24 * 60 * 60 * 1000
        });
        reply.setCookie('refreshToken', newRefreshToken, {
            httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: newRefreshMaxAge
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

export default {
    register,
    login,
    verifyEmail,
    verify2FA,
    logout,
    refreshToken,
    checkTokenBlacklist,
    autoRefreshToken,
    blacklistTokens
};