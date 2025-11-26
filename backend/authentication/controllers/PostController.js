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

        if (password.length < 8 || password.length > 128) {
            return reply.status(400).send({
                success: false,
                error: trlt.register && trlt.register.password_length || 'Password must be between 8 and 128 characters'
            });
        }

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

        const verificationToken = utils.storeVerificationToken(email, 'email_verification');

        utils.sendVerificationEmail(email, username, verificationToken)
            .then(() => {
            })
            .catch((emailError) => {
                User.destroy({ where: { id: newUser.id } }).catch(console.error);
                utils.tempStorage.delete(email);
            });

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
        }
        const { login, password } = request.body;

        if (!login || login.length < 1) {
            return reply.status(400).send({
                success: false,
                error: trlt.login && trlt.login.empty || 'Username or email is required'
            });
        }

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

        const twoFACode = utils.storeVerificationCode(user.email, { type: '2fa' });
        const userIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress || 'Unknown';

        utils.send2FAEmail(user.email, user.username, twoFACode, userIP, 'login')
            .then(() => {
            })
            .catch((emailError) => {
            });

        return (reply.send({ success: true, message: trlt.login.verify, next_step: '2fa_verification', email: user.email }));
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
			    <title>Email Verified - Transcendence</title>
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
			        <h1>🎉 Email Verified!</h1>

			        <p><strong>${user.username}</strong></p>

			        <p>Verification successful. You can close this tab and return to the site.</p>

			        <p>This tab will automatically close in <span id="count">5</span> seconds.</p>

			        <div class="btn" id="closeBtn">Close Window</div>
			    </div>

			    <script>
			        function tryClose() {
			            try { window.close(); } catch (e) {}
			            try { window.open('', '_self'); window.close(); } catch (e) {}
			            setTimeout(() => {
			                try { location.replace('about:blank'); } catch(e){}
			            }, 50);
			        }

			        let counter = 5;
			        const el = document.getElementById("count");

			        const interval = setInterval(() => {
			            counter--;
			            el.textContent = counter;

			            if (counter <= 0) {
			                clearInterval(interval);
			                tryClose();
			            }		        }, 1000);
		
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

        if (!login || login.length < 1) {
            return reply.status(400).send({
                success: false,
                error: trlt.verify2FA && trlt.verify2FA.login_empty || 'Username or email is required'
            });
        }

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

async function initPasswordChange(request, reply) {
	try {
		const { currentPassword, newPassword } = request.body;

		if (!currentPassword || !newPassword) {
			return reply.status(400).send({
				success: false,
				error: 'Current password and new password are required'
			});
		}

		if (currentPassword.length < 8 || currentPassword.length > 128) {
			return reply.status(400).send({
				success: false,
				error: 'Current password must be between 8 and 128 characters'
			});
		}

		if (newPassword.length < 8 || newPassword.length > 128) {
			return reply.status(400).send({
				success: false,
				error: 'New password must be between 8 and 128 characters'
			});
		}

		const passwordValidation = utils.validatePassword(newPassword);
		if (!passwordValidation.isValid) {
			return reply.status(400).send({
				success: false,
				error: passwordValidation.errors.join(', ')
			});
		}

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

		const isPasswordValid = await user.validatePassword(currentPassword);
		if (!isPasswordValid) {
			return reply.status(400).send({
				success: false,
				error: 'Current password is incorrect'
			});
		}

		const code = utils.storeVerificationCode(user.email, {
			type: 'password_change',
			newPassword: newPassword,
			userId: user.id
		});

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

		user.password = storedData.newPassword;
		await user.save();

		utils.tempStorage.delete(user.email);

		await user.clearRefreshToken();

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
			logout: true
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

		if (newEmail.length < 5 || newEmail.length > 254) {
			return reply.status(400).send({
				success: false,
				error: 'Email must be between 5 and 254 characters'
			});
		}

		if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u.test(newEmail)) {
			return reply.status(400).send({
				success: false,
				error: 'Invalid email format'
			});
		}

		if (password.length < 8 || password.length > 128) {
			return reply.status(400).send({
				success: false,
				error: 'Password must be between 8 and 128 characters'
			});
		}

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

		const isPasswordValid = await user.validatePassword(password);
		if (!isPasswordValid) {
			return reply.status(400).send({
				success: false,
				error: 'Password is incorrect'
			});
		}

		const existingUser = await User.findOne({ where: { email: newEmail.toLowerCase() } });
		if (existingUser) {
			return reply.status(400).send({
				success: false,
				error: 'Email already in use'
			});
		}

		if (user.email.toLowerCase() === newEmail.toLowerCase()) {
			return reply.status(400).send({
				success: false,
				error: 'New email cannot be the same as current email'
			});
		}

		const code = utils.storeVerificationCode(user.email.toLowerCase(), {
			type: 'email_change',
			newEmail: newEmail.toLowerCase(),
			userId: user.id,
			oldEmail: user.email.toLowerCase()
		});

		try {
			await utils.send2FAEmail(user.email, user.username, code, 'Unknown', 'email_change');

			return reply.send({
				success: true,
				message: 'Verification code sent to your current email address for email change',
				next_step: '2fa_verification',
				email: user.email.toLowerCase(),
				newEmail: newEmail.toLowerCase(),
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

		let storedData = null;
		let oldEmailKey = null;

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

		const oldEmail = user.email;
		const newEmail = storedData.newEmail;

		await user.update({
			email: newEmail,
			is_active: false
		});

		utils.tempStorage.delete(oldEmailKey);

		const verificationToken = utils.storeVerificationToken(newEmail, 'email_verification');

		try {
			await utils.sendVerificationEmail(newEmail, user.username, verificationToken);
		} catch (emailError) {
		}

		await user.clearRefreshToken();

		if (token) {
			utils.blacklistToken(token);
		}

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
			message: `Email successfully changed from ${oldEmail} to ${newEmail}. Please verify your new email address by clicking the link in the email.`,
			logout: true,
			requiresVerification: true,
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

		if (password.length < 8 || password.length > 128) {
			return reply.status(400).send({
				success: false,
				error: 'Password must be between 8 and 128 characters'
			});
		}

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

		const isPasswordValid = await user.validatePassword(password);
		if (!isPasswordValid) {
			return reply.status(400).send({
				success: false,
				error: 'Password is incorrect'
			});
		}

		const code = utils.storeVerificationCode(user.email, {
			type: 'delete_account',
			userId: user.id
		});

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
