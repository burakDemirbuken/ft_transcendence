import crypto from 'crypto';

export const tempStorage = new Map();
const tokenBlacklist = new Set();


export function blacklistToken(token)
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


export function isTokenBlacklisted(token)
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

export async function sendVerificationEmail(email, username, token)
{
	const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://email:3005';
	console.log("EMAIL SERVICE URL: ", emailServiceUrl);""
	const verificationUrl = `https://${process.env.HOST_IP}:3030/api/auth/verify-email?token=${token}`;

	const response = await fetch(`${emailServiceUrl}/send-verification`,
    {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify
        ({
			to: email,
			username: username,
			verificationUrl: verificationUrl,
			token: token
		})
	});

	if (!response.ok)
		throw new Error(`Email service error: ${response.status}`);
	return (response.json());
}

export async function send2FAEmail(email, username, code, userIP)
{
	const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://email:3005';

    const response = await fetch(`${emailServiceUrl}/send-2fa`,
    {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
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

export async function sendLoginNotification(email, username, userIP)
{
    const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://email:3005';

    const response = await fetch(`${emailServiceUrl}/send-login-notification`,
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

export function generateVerificationToken()
{
    return (crypto.randomBytes(32).toString('hex'));
}

export function generateVerificationCode() {
    return (Math.floor(100000 + Math.random() * 900000).toString());
}

export function storeVerificationToken(email, type = 'email_verification')
{
    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 30 * 60 * 1000);
    tempStorage.set(email,
    {
        token,
        expires,
        type
    });
    return (token);
}

export function storeVerificationCode(email, type = '2fa')
{
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 5 * 60 * 1000);
    tempStorage.set(email,
    {
        code,
        expires,
        type
    });
    return (code);
}
