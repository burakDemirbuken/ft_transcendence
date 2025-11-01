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
        utils.tempStorage.delete(user.email);
        const userIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress || 'Unknown';
        try {
            await utils.sendLoginNotification(user.email, user.username, userIP);
        } catch (emailError) {
            console.log('Login notification error:', emailError);
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

async function requestEmailChange(request, reply)
{
	const trlt = getTranslations(request.query.lang || "eng");
	try
	{
		// Cookie'den veya header'dan kullanıcı bilgisini al
		const cookieToken = request.cookies?.accessToken;
		const headerToken = request.headers?.authorization?.replace('Bearer ', '');
		const token = cookieToken || headerToken;

		if (!token) {
			return reply.status(401).send({
				success: false,
				error: 'Authentication required - provide cookie or Authorization header',
				code: 'NO_TOKEN'
			});
		}

		let userId, username, currentEmail;
		try {
			const decoded = request.server.jwt.verify(token);
			console.log("Decoded JWT token:", JSON.stringify(decoded, null, 2));
			userId = decoded.userId;
			username = decoded.username;
			currentEmail = decoded.email;
			console.log("Extracted values - userId:", userId, "username:", username, "currentEmail:", currentEmail);
		} catch (error) {
			console.log("JWT verify error:", error.message);
			return reply.status(401).send({
				success: false,
				error: 'Invalid token',
				code: 'INVALID_TOKEN'
			});
		}

		// Kullanıcıyı veritabanından getir
		const user = await User.findByPk(userId);
		if (!user) {
			return reply.status(404).send({
				success: false,
				error: trlt.unotFound || 'User not found'
			});
		}
			console.log("User from database:", {
			id: user.id,
			username: user.username,
			email: user.email,
			is_active: user.is_active
		});
		console.log("Current email from JWT vs DB:", currentEmail, "vs", user.email);

		// JWT token'da email boşsa database'den al
		const actualEmail = currentEmail || user.email;
		if (!actualEmail) {
			return reply.status(400).send({
				success: false,
				error: 'User email not found'
			});
		}

		// Email değiştirme token'ı oluştur
		const changeToken = utils.storeVerificationToken(actualEmail, 'email_change');
		console.log("Using email for change request:", actualEmail, "(from:", currentEmail ? "JWT" : "DB", ")");
		try {
			await utils.sendEmailChangeRequest(actualEmail, username, changeToken);
			return reply.send({
				success: true,
				message: 'Email change request sent. Please check your current email.',
				next_step: 'check_email'
			});
		} catch (emailError) {
			console.log("Email service error:", emailError);
			utils.tempStorage.delete(actualEmail);
			return reply.status(500).send({
				success: false,
				error: 'Failed to send email change request'
			});
		}
	}
	catch (error)
	{
		console.log('Request email change error:', error);
		return reply.status(500).send({
			success: false,
			error: 'Internal server error'
		});
	}
}

async function processEmailChange(request, reply)
{
    console.log("Processing email change request...");
	const trlt = getTranslations(request.query.lang || "eng");
	try
	{
		const { token, newEmail, oldEmail, password } = request.body;

		if (!token || !newEmail || !oldEmail || !password) {
			return reply.status(400).send({
				success: false,
				error: 'Missing required fields'
			});
		}

		// Token'ı kontrol et
		const storedData = utils.tempStorage.get(oldEmail);
		if (!storedData || storedData.type !== 'email_change') {
			return reply.status(400).send({
				success: false,
				error: 'Invalid or expired token'
			});
		}

		if (storedData.expires < new Date()) {
			utils.tempStorage.delete(oldEmail);
			return reply.status(400).send({
				success: false,
				error: 'Token has expired'
			});
		}

		if (storedData.token !== token) {
			return reply.status(400).send({
				success: false,
				error: 'Invalid token'
			});
		}

		// Kullanıcıyı eski email ile bul
		const user = await User.findByEmail(oldEmail);
		if (!user) {
			return reply.status(404).send({
				success: false,
				error: 'User not found'
			});
		}

		// Şifreyi kontrol et
		const isPasswordValid = await user.validatePassword(password);
		if (!isPasswordValid) {
			return reply.status(400).send({
				success: false,
				error: 'Invalid password'
			});
		}

		// Yeni email'in başka kullanıcı tarafından kullanılmadığını kontrol et
		const existingUser = await User.findByEmail(newEmail);
		if (existingUser && existingUser.id !== user.id) {
			return reply.status(409).send({
				success: false,
				error: 'Email already in use'
			});
		}

		// Eski token'ı temizle
		utils.tempStorage.delete(oldEmail);

		// Yeni email için doğrulama token'ı oluştur
		const verificationToken = utils.storeVerificationToken(newEmail, 'new_email_verification');

		// Eski email bilgilerini yeni email verification ile birlikte sakla
		utils.tempStorage.set(`change_${newEmail}`, {
			userId: user.id,
			oldEmail: oldEmail,
			newEmail: newEmail,
			expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat
			type: 'email_change_pending'
		});

		try {
			await utils.sendNewEmailVerification(newEmail, user.username, verificationToken);
			return reply.send({
				success: true,
				message: 'Verification email sent to your new email address. Please check and verify.',
				newEmail: newEmail,
				next_step: 'verify_new_email'
			});
		} catch (emailError) {
			utils.tempStorage.delete(newEmail);
			utils.tempStorage.delete(`change_${newEmail}`);
			return reply.status(500).send({
				success: false,
				error: 'Failed to send verification email'
			});
		}
	}
	catch (error)
	{
		console.log('Process email change error:', error);
		return reply.status(500).send({
			success: false,
			error: 'Internal server error'
		});
	}
}

async function verifyNewEmail(request, reply)
{
	const trlt = getTranslations(request.query.lang || "eng");
	try
	{
		const { token } = request.query;

		if (!token) {
			return reply.status(400).send({
				success: false,
				error: 'Verification token is required'
			});
		}

		// Token'ı bul
		let newEmail = null;
		for (const [email, data] of utils.tempStorage.entries()) {
			if (data.type === 'new_email_verification' && data.token === token) {
				if (data.expires > new Date()) {
					newEmail = email;
					break;
				} else {
					utils.tempStorage.delete(email);
				}
			}
		}

		if (!newEmail) {
			return reply.type('text/html').code(400).send(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>Email Verification - Invalid Token</title>
					<meta charset="UTF-8">
					<style>
						body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
						.error { color: #d32f2f; text-align: center; }
					</style>
				</head>
				<body>
					<div class="error">
						<h2>Invalid or Expired Token</h2>
						<p>The email verification link is invalid or has expired.</p>
					</div>
				</body>
				</html>
			`);
		}

		// Email değişiklik bilgilerini al
		const changeData = utils.tempStorage.get(`change_${newEmail}`);
		if (!changeData || changeData.type !== 'email_change_pending') {
			return reply.type('text/html').code(400).send(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>Email Change - Error</title>
					<meta charset="UTF-8">
					<style>
						body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
						.error { color: #d32f2f; text-align: center; }
					</style>
				</head>
				<body>
					<div class="error">
						<h2>Email Change Data Not Found</h2>
						<p>Email change request has expired or is invalid.</p>
					</div>
				</body>
				</html>
			`);
		}

		// Kullanıcıyı bul ve email'i güncelle
		const user = await User.findByPk(changeData.userId);
		if (!user) {
			return reply.type('text/html').code(404).send(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>Email Change - User Not Found</title>
					<meta charset="UTF-8">
					<style>
						body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
						.error { color: #d32f2f; text-align: center; }
					</style>
				</head>
				<body>
					<div class="error">
						<h2>User Not Found</h2>
						<p>The user account could not be found.</p>
					</div>
				</body>
				</html>
			`);
		}

		// Email'i güncelle
		await user.update({ email: newEmail.toLowerCase() });

		// Tüm temp data'yı temizle
		utils.tempStorage.delete(newEmail);
		utils.tempStorage.delete(`change_${newEmail}`);

		// Kullanıcının tüm token'larını blacklist'e ekle (yeniden login zorla)
		// Not: Bu noktada kullanıcının aktif token'larına erişimimiz yok
		// Bu yüzden sadece veritabanındaki refresh token'ı temizleyelim
		await user.clearRefreshToken();

		return reply.type('text/html').send(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>Email Successfully Changed</title>
				<meta charset="UTF-8">
				<style>
					body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
					.success { color: #2e7d32; text-align: center; }
					.info { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
				</style>
			</head>
			<body>
				<div class="success">
					<h2>✅ Email Successfully Changed!</h2>
					<p>Your email has been updated from:</p>
					<p><strong>${changeData.oldEmail}</strong></p>
					<p>to:</p>
					<p><strong>${newEmail}</strong></p>
				</div>
				<div class="info">
					<p><strong>Next Step:</strong> Please login again with your new email address.</p>
					<p>For security reasons, you have been logged out from all devices.</p>
				</div>
				<div style="text-align: center;">
					<a href="https://${process.env.HOST_IP}:3030" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Login</a>
				</div>
			</body>
			</html>
		`);
	}
	catch (error)
	{
		console.log('Verify new email error:', error);
		return reply.type('text/html').code(500).send(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>Email Verification - Error</title>
				<meta charset="UTF-8">
			</head>
			<body>
				<h2>Error</h2>
				<p>An error occurred while processing your email verification.</p>
			</body>
			</html>
		`);
	}
}

async function requestPasswordChange(request, reply)
{
	const trlt = getTranslations(request.query.lang || "eng");
	try
	{
		// JWT token'dan kullanıcıyı al
		const cookieToken = request.cookies?.accessToken;
		if (!cookieToken) {
			return reply.status(401).send({
				success: false,
				error: 'Authentication required'
			});
		}

		let userId, username, currentEmail;
		try {
			const decoded = request.server.jwt.verify(cookieToken);
			userId = decoded.userId;
			username = decoded.username;
			currentEmail = decoded.email;
		} catch (error) {
			return reply.status(401).send({
				success: false,
				error: 'Invalid authentication token'
			});
		}

		// Kullanıcıyı database'den al
		const user = await User.findByPk(userId);
		if (!user) {
			return reply.status(404).send({
				success: false,
				error: 'User not found'
			});
		}

		// Email'i al (JWT'den veya DB'den)
		const actualEmail = currentEmail || user.email;
		if (!actualEmail) {
			return reply.status(400).send({
				success: false,
				error: 'User email not found'
			});
		}

		// Password değiştirme token'ı oluştur
		const changeToken = utils.storeVerificationToken(actualEmail, 'password_change');
		
		try {
			await utils.sendPasswordChangeRequest(actualEmail, username, changeToken);
			return reply.send({
				success: true,
				message: 'Password change request sent. Please check your email.',
				next_step: 'check_email'
			});
		} catch (emailError) {
			console.log("Email service error:", emailError);
			utils.tempStorage.delete(actualEmail);
			return reply.status(500).send({
				success: false,
				error: 'Failed to send password change request'
			});
		}
	}
	catch (error)
	{
		console.log('Request password change error:', error);
		return reply.status(500).send({
			success: false,
			error: 'Internal server error'
		});
	}
}

async function processPasswordChange(request, reply)
{
	const trlt = getTranslations(request.query.lang || "eng");
	try
	{
		const { token, currentPassword, newPassword } = request.body;

		if (!token || !currentPassword || !newPassword) {
			return reply.status(400).send({
				success: false,
				error: 'Missing required fields'
			});
		}

		// Token'ı kontrol et
		let userEmail = null;
		for (const [email, data] of utils.tempStorage.entries()) {
			if (data.type === 'password_change' && data.token === token) {
				if (data.expires > new Date()) {
					userEmail = email;
					break;
				} else {
					utils.tempStorage.delete(email);
				}
			}
		}

		if (!userEmail) {
			return reply.status(400).send({
				success: false,
				error: 'Invalid or expired token'
			});
		}

		// Kullanıcıyı email ile bul
		const user = await User.findByEmail(userEmail);
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

		// Yeni şifrenin eski şifreyle aynı olmadığını kontrol et
		const isSamePassword = await user.validatePassword(newPassword);
		if (isSamePassword) {
			return reply.status(400).send({
				success: false,
				error: 'New password must be different from current password'
			});
		}

		// Şifreyi güncelle
		user.password = newPassword;
		await user.save();

		// Token'ı temizle
		utils.tempStorage.delete(userEmail);

		// Tüm refresh token'ları temizle (güvenlik için)
		await user.clearRefreshToken();

		return reply.send({
			success: true,
			message: 'Password successfully changed. Please login with your new password.',
			next_step: 'login'
		});
	}
	catch (error)
	{
		console.log('Process password change error:', error);
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
    requestEmailChange,
    processEmailChange,
    verifyNewEmail,
    requestPasswordChange,
    processPasswordChange
};