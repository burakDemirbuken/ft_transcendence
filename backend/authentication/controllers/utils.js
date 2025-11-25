import crypto from 'crypto';

const tempStorage = new Map();
const tokenBlacklist = new Set();


function blacklistToken(token)
{
	try
    {
		const base64Payload = token.split('.')[1];
		const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());

		if (payload.jti)
			tokenBlacklist.add(payload.jti);
		else if (payload.userId && payload.iat)
        {
			const tokenId = `${payload.userId}_${payload.iat}`;
			tokenBlacklist.add(tokenId);
		}
	}
    catch (error)
    {
		console.log('Token blacklist error:', error);
	}
}


function isTokenBlacklisted(token)
{
	try
    {
		const base64Payload = token.split('.')[1];
		const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());

		if (payload.jti)
			return (tokenBlacklist.has(payload.jti));
		else if (payload.userId && payload.iat)
			return (tokenBlacklist.has(`${payload.userId}_${payload.iat}`));
		return (false);
	}
    catch (error)
    {
		return (false);
	}
}

async function sendVerificationEmail(email, username, token)
{
	const response = await fetch(`http://email:3005/send-verification`,
    {
		method: 'POST',
		headers:
		{
			'Content-Type': 'application/json'
		},
		body: JSON.stringify
        ({
			to: email,
			username: username,
			verificationUrl: `https://${process.env.HOST_IP}:3030/api/auth/verify-email?token=${token}`,
			token: token
		})
	});

	if (!response.ok)
		throw new Error(`Email service error: ${response.status}`);
	return (response.json());
}

async function send2FAEmail(email, username, code, userIP)
{
    const response = await fetch(`http://email:3005/send-2fa`,
    {
		method: 'POST',
		headers:
		{
			'Content-Type': 'application/json'
		},
		body: JSON.stringify
        ({
			email: email,
			username: username,
			code: code,
			ip: userIP,
			timestamp: new Date().toISOString()
		})
	});

	if (!response.ok) {
		throw new Error(`Email service error: ${response.status}`);
	}

	return (response.json());
}

async function sendLoginNotification(email, username, userIP)
{
    const response = await fetch(`http://email:3005/send-login-notification`,
    {
        method: 'POST',
        headers:
        {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify
        ({
            email: email,
            username: username,
            ip: userIP,
            timestamp: new Date().toISOString()
        })
    });

    if (!response.ok)
        throw new Error(`Email service error: ${response.status}`);

    return (response.json());
}

function generateVerificationToken()
{
    return (crypto.randomBytes(32).toString('hex'));
}

function generateVerificationCode() {
    return (Math.floor(100000 + Math.random() * 900000).toString());
}

function storeVerificationToken(email, type = 'email_verification')
{
    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tempStorage.set(email,
    {
        token,
        expires,
        type
    });
    return (token);
}

function storeVerificationCode(email, data = {})
{
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika
    tempStorage.set(email,
    {
        code,
        expires,
        ...data  // Data içindeki tüm alanları yay (type, newPassword, userId vs.)
    });
    return (code);
}

export default
{
	blacklistToken,
	isTokenBlacklisted,
	sendVerificationEmail,
	send2FAEmail,
	sendLoginNotification,
	storeVerificationToken,
	storeVerificationCode,
	tempStorage
};