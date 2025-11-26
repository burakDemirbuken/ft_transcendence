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

        // Username validations
        if (username.length < 1 || username.length > 20) {
            return reply.status(400).send({
                success: false,
                error: trlt.register && trlt.register.username_length || 'Username must be between 1 and 20 characters'
            });
        }

        if (!/^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+$/u.test(username)) {
            return reply.status(400).send({
                success: false,
                error: trlt.register && trlt.register.username_invalid || 'Username can only contain letters, numbers, underscore and Turkish characters'
            });
        }

        // Email validations
        if (email.length < 5 || email.length > 254) {
            return reply.status(400).send({
                success: false,
                error: trlt.register && trlt.register.email_length || 'Email must be between 5 and 254 characters'
            });
        }

        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u.test(email)) {
            return reply.status(400).send({
                success: false,
                error: trlt.register && trlt.register.email_invalid || 'Invalid email format'
            });
        }

        // Password validations
        if (password.length < 8 || password.length > 128) {
            return reply.status(400).send({
                success: false,
                error: trlt.register && trlt.register.password_length || 'Password must be between 8 and 128 characters'
            });
        }

        // Şifre validasyonu
        const passwordValidation = utils.validatePassword(password);
        if (!passwordValidation.isValid) {
            return reply.status(400).send({
                success: false,
                error: passwordValidation.errors.join(', ')
            });
        }
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
                await fetch('http://profile:3006/internal/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userName: newUser.username,
                    })
                });
            } catch (profileError) {
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
            })
            .catch((emailError) => {
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

        // Login validation (username or email)
        if (!login || login.length < 1) {
            return reply.status(400).send({
                success: false,
                error: trlt.login && trlt.login.empty || 'Username or email is required'
            });
        }

        // Password validation
        if (!password || password.length < 8 || password.length > 128) {
            return reply.status(400).send({
                success: false,
                error: trlt.login && trlt.login.password_length || 'Password must be between 8 and 128 characters'
            });
        }

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
            utils.send2FAEmail(user.email, user.username, twoFACode, userIP, 'login')
                .then(() => {
                })
                .catch((emailError) => {
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
            await fetch('http://profile:3006/internal/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: user.username,
                })
            });
        } catch (profileError) {
        }
        if (request.method === 'GET') {
            return (reply.type('text/html; charset=utf-8').send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Doğrulandı - Transcendence</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 400px;
            margin: 0 auto;
        }
        h1 {
            color: #2e7d32;
        }
        .btn {
            background: #d32f2f;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
            cursor: pointer;
        }
        #count {
            font-weight: bold;
            color: #1976d2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Email Doğrulandı!</h1>

        <p><strong>${user.username}</strong></p>

        <p>Doğrulama işlemi başarılı. Bu sekmeyi kapatıp siteye geri dönebilirsiniz.</p>

        <p>Bu sekme <span id="count">5</span> saniye içinde otomatik olarak kapanacaktır.</p>

        <div class="btn" id="closeBtn">Pencereyi Kapat</div>
    </div>

    <script>
        function tryClose() {
            try { window.close(); } catch (e) {}
            try { window.open('', '_self'); window.close(); } catch (e) {}
            // Yine de kapanmazsa sekmeyi temizlemeye çalış
            setTimeout(() => {
                try { location.replace('about:blank'); } catch(e){}
            }, 50);
        }

        // Geri sayım
        let counter = 5;
        const el = document.getElementById("count");

        const interval = setInterval(() => {
            counter--;
            el.textContent = counter;

            if (counter <= 0) {
                clearInterval(interval);
                tryClose();
            }
        }, 1000);

        // Buton: manuel kapatma
        document.getElementById('closeBtn').onclick = tryClose;
    </script>
</body>
</html>
            `));
        } else {
            return (reply.send({ success: true, message: trlt.verify.success, user: user.toSafeObject() }));
        }
    } catch (error) {
        return (reply.status(500).send({ success: false, error: trlt.verify.system }));
    }
}
async function verify2FA(request, reply) {
    const trlt = getTranslations(request.query.lang || "eng");
    try {
        const { login, code, rememberMe } = request.body;

        // Login validation
        if (!login || login.length < 1) {
            return reply.status(400).send({
                success: false,
                error: trlt.verify2FA && trlt.verify2FA.login_empty || 'Username or email is required'
            });
        }

        // Code validation (6 digits)
        if (!code || !/^\d{6}$/.test(code)) {
            return reply.status(400).send({
                success: false,
                error: trlt.verify2FA && trlt.verify2FA.code_invalid || 'Code must be 6 digits'
            });
        }
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
            { expiresIn: '4h' }
        );
        const refreshExpiry = rememberMe ? '30d' : '7d';
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
            httpOnly: true, secure: true, sameSite: 'Lax', path: '/'
        });
        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true, secure: true, sameSite: 'Lax', path: '/'
        });
        reply.setCookie('authStatus', 'authenticated', {
            httpOnly: false, secure: true, sameSite: 'Lax', path: '/'
        });
        // Profile servisi çağrısı - ilk login'de profil oluştur
        try {
            await fetch('http://profile:3006/internal/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: user.username,
                })
            });
        } catch (profileError) {
        }

        utils.tempStorage.delete(user.email);
        const userIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress || 'Unknown';

        utils.sendLoginNotification(user.email, user.username, userIP).catch(() => {});

        reply.send({
            success: true,
            message: trlt.login.success,
            user: user.toSafeObject(),
            accessToken: accessToken
        });
    } catch (error) {
        return (reply.status(500).send({ success: false, error: trlt.verify2FA.system }));
    }
}

async function logout(request, reply)
{
	const trlt = getTranslations(request.query.lang || "eng");
	try
	{
		// getDataFromToken kullan (header'dan veya cookie'den)
		const userData = await request.server.getDataFromToken(request);
		const username = userData?.username;

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
				// getDataFromToken kullan
				const userData = await request.server.getDataFromToken(request);
				if (userData && userData.userId)
				{
					currentUser = await User.findByPk(userData.userId);
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

// ============================================
// ŞİFRE DEĞİŞTİRME - 2FA İLE
// ============================================

async function initPasswordChange(request, reply) {
	try {
		const { currentPassword, newPassword } = request.body;

		if (!currentPassword || !newPassword) {
			return reply.status(400).send({
				success: false,
				error: 'Current password and new password are required'
			});
		}

		// Current password validation
		if (currentPassword.length < 8 || currentPassword.length > 128) {
			return reply.status(400).send({
				success: false,
				error: 'Current password must be between 8 and 128 characters'
			});
		}

		// New password validation
		if (newPassword.length < 8 || newPassword.length > 128) {
			return reply.status(400).send({
				success: false,
				error: 'New password must be between 8 and 128 characters'
			});
		}

		// Yeni şifre validasyonu
		const passwordValidation = utils.validatePassword(newPassword);
		if (!passwordValidation.isValid) {
			return reply.status(400).send({
				success: false,
				error: passwordValidation.errors.join(', ')
			});
		}

		// getDataFromToken kullan (header'dan veya cookie'den)
		const userData = await request.server.getDataFromToken(request);

		if (!userData?.userId) {
			return reply.status(401).send({
				success: false,
				error: 'Authentication required'
			});
		}

		const user = await User.findByPk(userData.userId);

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
			await utils.send2FAEmail(user.email, user.username, code, 'Unknown', 'password_change');

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

async function confirmPasswordChange(request, reply) {
	try {
		const { code } = request.body;

		if (!code) {
			return reply.status(400).send({
				success: false,
				error: 'Verification code is required'
			});
		}

		// getDataFromToken kullan (header'dan veya cookie'den)
		const userData = await request.server.getDataFromToken(request);

		if (!userData?.userId) {
			return reply.status(401).send({
				success: false,
				error: 'Authentication required'
			});
		}

		const user = await User.findByPk(userData.userId);

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

async function initEmailChange(request, reply) {
	const trlt = getTranslations(request.query.lang || "eng");
	try {
		const { newEmail, password } = request.body;

		if (!newEmail || !password) {
			return reply.status(400).send({
				success: false,
				error: 'New email and password are required'
			});
		}

		// Email length validation
		if (newEmail.length < 5 || newEmail.length > 254) {
			return reply.status(400).send({
				success: false,
				error: 'Email must be between 5 and 254 characters'
			});
		}

		// Email pattern validation
		if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u.test(newEmail)) {
			return reply.status(400).send({
				success: false,
				error: 'Invalid email format'
			});
		}

		// Password validation
		if (password.length < 8 || password.length > 128) {
			return reply.status(400).send({
				success: false,
				error: 'Password must be between 8 and 128 characters'
			});
		}

		// getDataFromToken kullan (header'dan veya cookie'den)
		const userData = await request.server.getDataFromToken(request);

		if (!userData?.userId) {
			return reply.status(401).send({
				success: false,
				error: 'Authentication required'
			});
		}

		const user = await User.findByPk(userData.userId);

		if (!user) {
			return reply.status(404).send({
				success: false,
				error: 'User not found'
			});
		}

		// Mevcut şifreyi kontrol et
		const isPasswordValid = await user.validatePassword(password);
		if (!isPasswordValid) {
			return reply.status(400).send({
				success: false,
				error: 'Password is incorrect'
			});
		}

		// Yeni email'in zaten kullanılıp kullanılmadığını kontrol et
		const existingUser = await User.findOne({ where: { email: newEmail.toLowerCase() } });
		if (existingUser) {
			return reply.status(400).send({
				success: false,
				error: 'Email already in use'
			});
		}

		// Kullanıcının eski email'ini kontrol et (aynı email girilmişse)
		if (user.email.toLowerCase() === newEmail.toLowerCase()) {
			return reply.status(400).send({
				success: false,
				error: 'New email cannot be the same as current email'
			});
		}

		// 6 haneli 2FA kodu oluştur ve sakla (ESKİ email'e gönderilecek)
		const code = utils.storeVerificationCode(user.email.toLowerCase(), {
			type: 'email_change',
			newEmail: newEmail.toLowerCase(),
			userId: user.id,
			oldEmail: user.email.toLowerCase()
		});

		// ESKİ email adresine 2FA kodunu gönder (güvenlik için)
		try {
			await utils.send2FAEmail(user.email, user.username, code, 'Unknown', 'email_change');

			return reply.send({
				success: true,
				message: 'Email değişimi için doğrulama kodu mevcut email adresinize gönderildi',
				next_step: '2fa_verification',
				email: user.email.toLowerCase(), // Eski email göster
				newEmail: newEmail.toLowerCase(), // Yeni email'i de bilgi olarak gönder
				expiresIn: '10 minutes'
			});
		} catch (emailError) {
			utils.tempStorage.delete(newEmail.toLowerCase());
			return reply.status(500).send({
				success: false,
				error: 'Failed to send verification code'
			});
		}

	} catch (error) {
		return reply.status(500).send({
			success: false,
			error: 'Internal server error'
		});
	}
}

async function confirmEmailChange(request, reply) {
	const trlt = getTranslations(request.query.lang || "eng");
	try {
		const { code } = request.body;

		if (!code) {
			return reply.status(400).send({
				success: false,
				error: 'Verification code is required'
			});
		}

		// getDataFromToken kullan (header'dan veya cookie'den)
		const userData = await request.server.getDataFromToken(request);

		if (!userData?.userId) {
			return reply.status(401).send({
				success: false,
				error: 'Authentication required'
			});
		}

		const user = await User.findByPk(userData.userId);

		if (!user) {
			return reply.status(404).send({
				success: false,
				error: 'User not found'
			});
		}

		// 2FA kodunu kontrol et - ESKİ EMAIL'de saklı
		let storedData = null;
		let oldEmailKey = null;

		// tempStorage'da kullanıcının ESKİ email'ini ara
		for (const [email, data] of utils.tempStorage.entries()) {
			if (data.type === 'email_change' && data.userId === user.id && email === user.email.toLowerCase()) {
				storedData = data;
				oldEmailKey = email;
				break;
			}
		}

		if (!storedData) {
			return reply.status(400).send({
				success: false,
				error: 'No pending email change request'
			});
		}

		if (storedData.code !== code) {
			return reply.status(400).send({
				success: false,
				error: 'Invalid verification code'
			});
		}

		if (storedData.expires < new Date()) {
			utils.tempStorage.delete(oldEmailKey);
			return reply.status(400).send({
				success: false,
				error: 'Verification code has expired'
			});
		}

		// Email'i değiştir
		const oldEmail = user.email;
		const newEmail = storedData.newEmail;

		// Önce kullanıcıyı inaktif yap (yeni email doğrulanana kadar)
		await user.update({
			email: newEmail,
			is_active: false  // Yeni email doğrulanana kadar inactive
		});

		// Temp storage'ı temizle
		utils.tempStorage.delete(oldEmailKey);

		// Yeni email için doğrulama token'ı oluştur
		const verificationToken = utils.storeVerificationToken(newEmail, 'email_verification');

		// Yeni email adresine email doğrulama linkini gönder
		try {
			await utils.sendVerificationEmail(newEmail, user.username, verificationToken);
		} catch (emailError) {
			// Email gönderemesek bile işlemi tamamla
		}

		// Kullanıcının refresh token'ını temizle (güvenlik için)
		await user.clearRefreshToken();

		// Kullanıcının token'larını blacklist'e ekle
		if (token) {
			utils.blacklistToken(token);
		}

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
			message: `Email başarıyla ${oldEmail} adresinden ${newEmail} adresine değiştirildi. Yeni email adresinizi doğrulamak için gelen emaildeki linke tıklayın.`,
			logout: true,  // Frontend'e logout olduğunu bildir
			requiresVerification: true,  // Yeni email doğrulama gerekli
			old_email: oldEmail,
			new_email: newEmail
		});

	} catch (error) {
		return reply.status(500).send({
			success: false,
			error: 'Internal server error'
		});
	}
}

async function initDeleteAccount(request, reply) {
	try {
		const { password } = request.body;

		if (!password) {
			return reply.status(400).send({
				success: false,
				error: 'Password is required'
			});
		}

		// Password validation
		if (password.length < 8 || password.length > 128) {
			return reply.status(400).send({
				success: false,
				error: 'Password must be between 8 and 128 characters'
			});
		}

		// getDataFromToken kullan (header'dan veya cookie'den)
		const userData = await request.server.getDataFromToken(request);

		if (!userData?.userId) {
			return reply.status(401).send({
				success: false,
				error: 'Authentication required'
			});
		}

		const user = await User.findByPk(userData.userId);

		if (!user) {
			return reply.status(404).send({
				success: false,
				error: 'User not found'
			});
		}

		// Mevcut şifreyi kontrol et
		const isPasswordValid = await user.validatePassword(password);
		if (!isPasswordValid) {
			return reply.status(400).send({
				success: false,
				error: 'Password is incorrect'
			});
		}

		// 6 haneli 2FA kodu oluştur ve sakla
		const code = utils.storeVerificationCode(user.email, {
			type: 'delete_account',
			userId: user.id
		});

		// 2FA kodunu email ile gönder
		await utils.send2FAEmail(user.email, user.username, code, 'Unknown', 'delete_account');

		return reply.send({
			success: true,
			message: '2FA code sent to your email'
		});

	} catch (error) {
		console.error('Init delete account error:', error);
		return reply.status(500).send({
			success: false,
			error: 'Internal server error'
		});
	}
}



export default
{
    register,
    login,
    verifyEmail,
    verify2FA,
    logout,
    checkTokenBlacklist,
    autoRefreshToken,
    initEmailChange,
    confirmEmailChange,
    initPasswordChange,
    confirmPasswordChange,
    initDeleteAccount
};
