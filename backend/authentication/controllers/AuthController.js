import User from '../models/User.js';
import { getTranslations } from '../I18n/I18n.js';
import
{
	blacklistToken,
	isTokenBlacklisted,
	sendVerificationEmail,
	send2FAEmail,
	sendLoginNotification,
}	from './utils.js';



class AuthController {

	async checkUsername(request, reply)
	{
		const trlt = getTranslations(request.query.lang || "eng");

		try
		{
			const { username } = request.query;

			if (!username)
				return (reply.status(400).send({ success: false, error: trlt.username && trlt.username.empty || 'Username is required' }));

			const user = await User.findByUsername(username);

			return (reply.send({
				exists: !!user,
				username: username,
				available: !user,
				message: user ? (trlt.username && trlt.username.taken || 'Username already taken') : (trlt.username && trlt.username.available || 'Username available')
			}));

		}
		catch (error)
		{
			console.error('Check username error:', error);
			return (reply.status(500).send({ success: false, error: trlt.username && trlt.username.fail || 'Username check failed' }));
		}
	}

	async checkEmail(request, reply)
	{
		const trlt = getTranslations(request.query.lang || "eng");

		try
		{
			const { email } = request.query;

			if (!email)
				return (reply.status(400).send({ success: false, error: trlt.email.empty }));

			const user = await User.findByEmail(email);
			return (reply.send({ exists: !!user, message: user ? trlt.email.taken : trlt.email.availible }));

		} 
		catch (error)
		{
			return (reply.status(500).send({ success: false, error: trlt.email.fail }));
		}
	}

	async register(request, reply)
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

			const verificationToken = storeVerificationToken(email, 'email_verification');

			try
			{
				await sendVerificationEmail(email, username, verificationToken);
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
				tempStorage.delete(email);
				return (reply.status(400).send({ success: false, error: trlt.register.fail }));
			}
		} catch (error)
		{
			console.log('Register error:', error);
			return (reply.status(500).send({ success: false, error: trlt.register.system }));
		}
	}

	async verifyEmail(request, reply)
	{
		const trlt = getTranslations(request.query.lang || "eng");

		try
		{
			const token = request.query.token;
			if (!token)
				return (reply.status(400).send({ success: false, error: trlt.token.notFound }));

			let storedData = null;
			let userEmail = null;

			for (const [emailKey, data] of tempStorage.entries())
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
				tempStorage.delete(userEmail);
				return (reply.status(400).send({ success: false, error: trlt.token.expired }));
			}

			const user = await User.findByEmail(userEmail);
			if (!user)
				return (reply.status(404).send({ success: false, error: trlt.unotFound }));

			user.is_active = true;
			await user.save();
			tempStorage.delete(userEmail);

			try {
				await fetch('http://profile:3006/create', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userName: user.username,
						email: user.email,
						userId: user.id
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
							<a href="https://localhost:3030/login" class="btn">Giriş Yap</a>
						</div>
						<script>setTimeout(() => window.location.href = 'https://localhost:3030/login', 5000);</script>
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

	async login(request, reply) {
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

			const twoFACode = storeVerificationCode(user.email, '2fa');
			const userIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress || 'Unknown';

			try {
				await send2FAEmail(user.email, user.username, twoFACode, userIP);
			} catch (emailError) {
				console.log('2FA email error:', emailError);
			}

			return (reply.send({ success: true, message: trlt.login.verify, next_step: '2fa_verification', email: user.email }));

		} catch (error) {
			console.log('Login error:', error);
			return (reply.status(500).send({ success: false, error: trlt.login.system }));
		}
	}

	async verify2FA(request, reply) {
		const trlt = getTranslations(request.query.lang || "eng");

		try {
			const { login, code, rememberMe } = request.body;

			if (!login || !code)
				return (reply.status(400).send({ success: false, error: trlt.verify2FA.empty }));

			const user = await User.findByEmail(login) || await User.findByUsername(login);
			if (!user)
				return (reply.status(404).send({ success: false, error: trlt.unotFound }));

			const storedData = tempStorage.get(user.email);
			if (!storedData || storedData.type !== '2fa')
				return (reply.status(400).send({ success: false, error: trlt.verify2FA.expired }));

			if (storedData.expires < new Date()) {
				tempStorage.delete(user.email);
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

			reply.setCookie('accessToken', accessToken, {
				httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 15 * 60 * 1000
			});

			reply.setCookie('refreshToken', refreshToken, {
				httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: refreshMaxAge
			});

			tempStorage.delete(user.email);

			const userIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress || 'Unknown';

			try {
				await sendLoginNotification(user.email, user.username, userIP);
			} catch (emailError) {
				console.log('Login notification error:', emailError);
			}

			reply.send({ success: true, message: trlt.login.success, user: user.toSafeObject() });

		} catch (error) {
			console.log('2FA verification error:', error);
			return (reply.status(500).send({ success: false, error: trlt.verify2FA.system }));
		}
	}

	async getProfile(request, reply) {
		const trlt = getTranslations(request.query.lang || "eng");

		try {
			const userId = request.headers['x-user-id'];
			
			if (!userId) {
				return (reply.status(401).send({ 
					success: false, 
					error: 'User authentication required',
					code: 'NO_USER_INFO'
				}));
			}

			const user = await User.findByPk(userId);
			if (!user) {
				return (reply.status(404).send({ success: false, error: trlt.unotFound }));
			}

			reply.send({ success: true, user: user.toSafeObject() });

		} catch (error) {
			console.log('Get profile error:', error);
			reply.status(500).send({ success: false, error: trlt.profile.fail });
		}
	}

	// LOGOUT
	async logout(request, reply) {
		const trlt = getTranslations(request.query.lang || "eng");
		
		try
		{
			reply.clearCookie('accessToken',
			{
				httpOnly: true, secure: true, sameSite: 'strict', path: '/'
			});

			reply.clearCookie('refreshToken',
			{
				httpOnly: true, secure: true, sameSite: 'strict', path: '/'
			});

			reply.send({ 
				success: true, 
				message: trlt.logout.success,
				user: request.headers['x-user-username']
			});

		} catch (error) {
			console.log('Logout error:', error);
			reply.status(500).send({ success: false, error: trlt.logout.fail });
		}
	}

	async refreshToken(request, reply) {
		try {
			const oldRefreshToken = request.cookies.refreshToken;
			
			if (!oldRefreshToken) {
				return (reply.status(401).send({
					success: false,
					error: 'No refresh token provided',
					code: 'NO_REFRESH_TOKEN'
				}));
			}

			let decoded;
			try {
				decoded = request.server.jwt.verify(oldRefreshToken);
			} catch (err) {
				return (reply.status(401).send({
					success: false,
					error: 'Invalid refresh token',
					code: 'INVALID_REFRESH_TOKEN'
				}));
			}

			if (decoded.type !== 'refresh') {
				return (reply.status(401).send({
					success: false,
					error: 'Invalid token type',
					code: 'INVALID_TOKEN_TYPE'
				}));
			}

			const user = await User.findByPk(decoded.userId);
			if (!user) {
				return (reply.status(401).send({
					success: false,
					error: 'User not found',
					code: 'USER_NOT_FOUND'
				}));
			}

			// Yeni access token oluştur
			const newAccessToken = await reply.jwtSign(
				{ userId: user.id, username: user.username, email: user.email, type: 'access' },
				{ expiresIn: '15m' }
			);

			// Eski refresh token'ı blacklist'e ekle (security)
			blacklistToken(oldRefreshToken);

			// Refresh token'ın kalan süresini hesapla
			const now = Math.floor(Date.now() / 1000);
			const remainingTime = decoded.exp - now;
			const remainingDays = Math.max(1, Math.ceil(remainingTime / (24 * 60 * 60))); // En az 1 gün
			
			// Remember me durumunu koru
			const isRememberMe = decoded.rememberMe || false;
			const maxAllowedDays = isRememberMe ? 30 : 7;
			
			// Kalan süre kadar yeni refresh token oluştur (ama max limit aşmasın)
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

			// Cookie'leri güncelle
			reply.setCookie('accessToken', newAccessToken, {
				httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 15 * 60 * 1000
			});

			reply.setCookie('refreshToken', newRefreshToken, {
				httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: newRefreshMaxAge
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

		} catch (error) {
			console.log('Refresh token error:', error);
			reply.status(500).send({ 
				success: false, 
				error: 'Internal server error' 
			});
		}
	}

	async deleteProfile(request, reply) {
		const trlt = getTranslations(request.query.lang || "eng");

		try {
			const tokenUserId = request.headers['x-user-id'];
			const { userId, userEmail, username } = request.body || {};
			
			let user;
			
			if (tokenUserId) {
				user = await User.findByPk(parseInt(tokenUserId));
			} else if (userId) {
				user = await User.findByPk(userId);
			} else if (username) {
				user = await User.findByUsername(username);
			} else if (userEmail) {
				user = await User.findByEmail(userEmail);
			} else {
				return (reply.status(400).send({ 
					success: false, 
					error: 'Authentication required or user identifier missing',
					code: 'NO_IDENTIFIER'
				}));
			}

			if (!user) {
				return (reply.status(404).send({ 
					success: false, 
					error: trlt.unotFound || 'User not found' 
				}));
			}

			if (tokenUserId && parseInt(tokenUserId) !== user.id) {
				return (reply.status(403).send({
					success: false,
					error: 'You can only delete your own account',
					code: 'PERMISSION_DENIED'
				}));
			}

			const deletedUserInfo = { username: user.username, email: user.email };

			await User.destroy({ where: { id: user.id } });

			const serviceNotifications = [
				fetch('http://profile:3006/profile', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json', 'X-Auth-Service': 'true' },
					body: JSON.stringify({ userName: deletedUserInfo.username })
				}).catch(err => console.log('Profile service error:', err)),

				fetch('http://friend:3007/list', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json', 'X-Auth-Service': 'true' },
					body: JSON.stringify({ userName: deletedUserInfo.username })
				}).catch(err => console.log('Friend service error:', err))
			];

			Promise.all(serviceNotifications);
			
			if (tempStorage.has(deletedUserInfo.email)) {
				tempStorage.delete(deletedUserInfo.email);
			}

			const accessToken = request.cookies?.accessToken;
			const refreshToken = request.cookies?.refreshToken;
			
			if (accessToken) blacklistToken(accessToken);
			if (refreshToken) blacklistToken(refreshToken);

			reply.clearCookie('accessToken', {
				httpOnly: true, secure: true, sameSite: 'strict', path: '/'
			});

			reply.clearCookie('refreshToken', {
				httpOnly: true, secure: true, sameSite: 'strict', path: '/'
			});

			reply.send({ 
				success: true, 
				message: trlt.delete?.success || 'Account successfully deleted',
				deleted_user: deletedUserInfo
			});

		} catch (error) {
			console.log('Delete profile error:', error);
			reply.status(500).send({ 
				success: false, 
				error: trlt.delete?.fail || 'Failed to delete account' 
			});
		}
	}

	async checkTokenBlacklist(request, reply) {
		try {
			const { token } = request.body;
			const blacklisted = isTokenBlacklisted(token);
			
			return (reply.send({
				success: true,
				isBlacklisted: blacklisted
			}));
		} catch (error) {
			console.log('Token blacklist check error:', error);
			return (reply.status(500).send({
				success: false,
				error: 'Failed to check token status'
			}));
		}
	}

	async autoRefreshToken(request, reply) {
		try {
			const accessToken = request.cookies.accessToken;
			const refreshToken = request.cookies.refreshToken;

			// Access token yoksa veya geçersizse refresh et
			let needsRefresh = false;
			let currentUser = null;

			if (!accessToken) {
				needsRefresh = true;
			} else {
				try {
					const decoded = request.server.jwt.verify(accessToken);
					if (decoded.type === 'access') {
						currentUser = await User.findByPk(decoded.userId);
						// Token geçerli, refresh gerekmez
						return (reply.send({
							success: true,
							action: 'no_refresh_needed',
							user: currentUser?.toSafeObject()
						}));
					}
				} catch (err) {
					// Access token expired veya invalid
					needsRefresh = true;
				}
			}

			// Refresh token ile yeni access token al
			if (needsRefresh && refreshToken) {
				try {
					const decoded = request.server.jwt.verify(refreshToken);
					if (decoded.type === 'refresh' && !isTokenBlacklisted(refreshToken)) {
						// refreshToken method'unu çağır
						return (await this.refreshToken(request, reply));
					}
				} catch (err) {
					// Refresh token da geçersiz
				}
			}

			// Her iki token da geçersiz
			return (reply.status(401).send({
				success: false,
				action: 'login_required',
				error: 'Authentication required'
			}));

		} catch (error) {
			console.log('Auto refresh error:', error);
			return (reply.status(500).send({
				success: false,
				error: 'Token refresh failed'
			}));
		}
	}

	async blacklistTokens(request, reply) {
		try {
			const { accessToken, refreshToken } = request.body;
			let blacklistedCount = 0;
			
			if (accessToken) {
				blacklistToken(accessToken);
				blacklistedCount++;
			}
			
			if (refreshToken) {
				blacklistToken(refreshToken);
				blacklistedCount++;
			}
			
			return (reply.send({
				success: true,
				message: `${blacklistedCount} tokens blacklisted`,
				blacklistedCount: blacklistedCount
			}));
		} catch (error) {
			console.log('Token blacklist error:', error);
			return (reply.status(500).send({
				success: false,
				error: 'Failed to blacklist tokens'
			}));
		}
	}
}

export default new AuthController();
