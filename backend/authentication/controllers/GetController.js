import User from '../models/User.js';
import { getTranslations } from '../I18n/I18n.js';
import utils from './utils.js';

async function checkUsername(request, reply)
{
    const trlt = getTranslations(request.query.lang || "eng");
    try
    {
        const { username } = request.query;
        if (!username)
            return (reply.status(400).send({ success: false, error: trlt.username && trlt.username.empty || 'Username is required' }));
        const user = await User.findByUsername(username);
        console.log('Checking username availability for:', username);
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
async function checkEmail(request, reply)
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


async function getProfile(request, reply) {
    const trlt = getTranslations(request.query.lang || "eng");
    try {
        let userId;

        // Cookie'den JWT token'ı çek ve decode et
        const cookieToken = request.cookies.accessToken ?? {};
        if (cookieToken) {
            try {
                const decoded = request.server.jwt.verify(cookieToken);
                userId = decoded.userId;
            } catch (error) {
                console.log('JWT token decode error:', error);
            }
        }

        if (!userId)
        {
            return (reply.status(401).send({
                success: false,
                error: 'User authentication required',
                code: 'NO_USER_INFO'
            }));
        }
        const user = await User.findByPk(userId);
        if (!user)
        {
            return (reply.status(404).send({ success: false, error: trlt.unotFound }));
        }
        reply.send({ success: true, user: user.toSafeObject() });
    }
    catch (error)
    {
        console.log('Get profile error:', error);
        reply.status(500).send({ success: false, error: trlt.profile.fail });
    }
}

async function showEmailChangeForm(request, reply) {
    const trlt = getTranslations(request.query.lang || "eng");
    try {
        const { token } = request.query;

        // Token'ı kontrol et
        let userEmail = null;
        for (const [email, data] of utils.tempStorage.entries()) {
            if (data.type === 'email_change' && data.token === token) {
                if (data.expires > new Date()) {
                    userEmail = email;
                    break;
                } else {
                    utils.tempStorage.delete(email);
                }
            }
        }

        if (!userEmail) {
            return reply.type('text/html').code(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Email Change - Invalid Token</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
                        .error { color: #d32f2f; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h2>Invalid or Expired Token</h2>
                        <p>Email change request has expired or is invalid.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Email değiştirme formunu göster
        return reply.type('text/html').send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Change Email Address</title>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
                    .form-container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .form-group { margin-bottom: 20px; }
                    label { display: block; margin-bottom: 5px; font-weight: bold; }
                    input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
                    .btn { background: #1976d2; color: white; padding: 12px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-size: 16px; }
                    .btn:hover { background: #1565c0; }
                    .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="form-container">
                    <h2>Change Email Address</h2>
                    <div class="info">
                        <p><strong>Current email:</strong> ${userEmail}</p>
                        <p>Please enter your new email address and current password to confirm the change.</p>
                    </div>

                    <form action="/api/auth/process-email-change" method="POST">
                        <input type="hidden" name="token" value="${token}">
                        <input type="hidden" name="oldEmail" value="${userEmail}">

                        <div class="form-group">
                            <label for="newEmail">New Email Address:</label>
                            <input type="email" id="newEmail" name="newEmail" required>
                        </div>

                        <div class="form-group">
                            <label for="password">Current Password:</label>
                            <input type="password" id="password" name="password" required>
                        </div>

                        <button type="submit" class="btn">Change Email</button>
                    </form>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.log('Show email change form error:', error);
        return reply.type('text/html').code(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Error</title></head>
            <body><h2>Error</h2><p>An error occurred.</p></body>
            </html>
        `);
    }
}

async function showPasswordChangeForm(request, reply) {
    const trlt = getTranslations(request.query.lang || "eng");
    try {
        const { token } = request.query;

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
            return reply.type('text/html').code(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Password Change - Invalid Token</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
                        .error { color: #d32f2f; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h2>Invalid or Expired Token</h2>
                        <p>Password change request has expired or is invalid.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Şifre değiştirme formunu göster
        return reply.type('text/html').send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Change Password</title>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
                    .form-container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .form-group { margin-bottom: 20px; }
                    label { display: block; margin-bottom: 5px; font-weight: bold; }
                    input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
                    .btn { background: #1976d2; color: white; padding: 12px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-size: 16px; }
                    .btn:hover { background: #1565c0; }
                    .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                    .password-requirements { font-size: 12px; color: #666; margin-top: 5px; }
                </style>
            </head>
            <body>
                <div class="form-container">
                    <h2>Change Password</h2>
                    <div class="info">
                        <p><strong>Account:</strong> ${userEmail}</p>
                        <p>Please enter your current password and new password.</p>
                    </div>

                    <form action="/api/auth/process-password-change" method="POST">
                        <input type="hidden" name="token" value="${token}">

                        <div class="form-group">
                            <label for="currentPassword">Current Password:</label>
                            <input type="password" id="currentPassword" name="currentPassword" required>
                        </div>

                        <div class="form-group">
                            <label for="newPassword">New Password:</label>
                            <input type="password" id="newPassword" name="newPassword" required minlength="8">
                            <div class="password-requirements">
                                Minimum 8 characters required
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="confirmPassword">Confirm New Password:</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" required>
                        </div>

                        <button type="submit" class="btn">Change Password</button>
                    </form>

                    <script>
                        document.querySelector('form').addEventListener('submit', function(e) {
                            const newPassword = document.getElementById('newPassword').value;
                            const confirmPassword = document.getElementById('confirmPassword').value;
                            if (newPassword !== confirmPassword) {
                                e.preventDefault();
                                alert('New password and confirmation do not match!');
                            }
                        });
                    </script>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.log('Show password change form error:', error);
        return reply.type('text/html').code(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Error</title></head>
            <body><h2>Error</h2><p>An error occurred.</p></body>
            </html>
        `);
    }
}

async function healthCheck(request, reply) {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
}

export default
{
    checkUsername,
    checkEmail,
    getProfile,
    showEmailChangeForm,
    showPasswordChangeForm,
    healthCheck
};
