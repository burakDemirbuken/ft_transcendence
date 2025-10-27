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
        
        // Token'ı kontrol et - hangi email için olduğunu bul
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
                        <p>The email change link is invalid or has expired.</p>
                        <p>Please request a new email change from your account settings.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // HTML form'u göster
        const htmlForm = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Change Email Address</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 500px;
                        margin: 50px auto;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    .container {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h2 { color: #2e7d32; text-align: center; }
                    .form-group {
                        margin-bottom: 20px;
                    }
                    label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                        color: #333;
                    }
                    input[type="email"], input[type="password"] {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        box-sizing: border-box;
                        font-size: 16px;
                    }
                    .input-valid {
                        border-color: #4caf50;
                    }
                    .input-error {
                        border-color: #f44336;
                    }
                    button {
                        width: 100%;
                        padding: 12px;
                        background-color: #2e7d32;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                    }
                    button:hover:not(:disabled) {
                        background-color: #1b5e20;
                    }
                    button:disabled {
                        background-color: #ccc;
                        cursor: not-allowed;
                    }
                    .info {
                        background-color: #e3f2fd;
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                        border-left: 4px solid #2196f3;
                    }
                    .current-email {
                        color: #666;
                        font-style: italic;
                    }
                    .validation-message {
                        font-size: 14px;
                        margin-top: 5px;
                        padding: 5px;
                        border-radius: 3px;
                    }
                    .success {
                        color: #4caf50;
                        background-color: #e8f5e8;
                    }
                    .error {
                        color: #f44336;
                        background-color: #ffebee;
                    }
                    .loading {
                        color: #ff9800;
                        background-color: #fff3e0;
                    }
                    .success-screen {
                        text-align: center;
                        display: none;
                    }
                    .success-screen h3 {
                        color: #4caf50;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div id="form-screen">
                        <h2>Change Email Address</h2>
                        
                        <div class="info">
                            <strong>Email Change Request</strong>
                            <br><br>
                            Please enter your current email, new email address and confirm with your password.
                        </div>

                        <form id="emailChangeForm">
                            <input type="hidden" name="token" value="${token}">
                            
                            <div class="form-group">
                                <label for="currentEmail">Current Email Address:</label>
                                <input type="email" id="currentEmail" name="oldEmail" required>
                                <div id="currentEmailValidation" class="validation-message"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="newEmail">New Email Address:</label>
                                <input type="email" id="newEmail" name="newEmail" required>
                                <div id="emailValidation" class="validation-message"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="password">Current Password:</label>
                                <input type="password" id="password" name="password" required>
                            </div>
                            
                            <button type="submit" id="submitBtn" disabled>Change Email</button>
                        </form>
                    </div>

                    <div id="success-screen" class="success-screen">
                        <h3>✅ Email Change Request Sent!</h3>
                        <p>A verification link has been sent to your <strong>new email address</strong>.</p>
                        <p>Please check your email and click the verification link to complete the email change process.</p>
                        <p><small>You can close this page now.</small></p>
                    </div>
                </div>

                <script>
                const HOST_IP = '${process.env.HOST_IP}';
                let emailCheckTimeout;
                let isCurrentEmailFilled = false;
                let isNewEmailValid = false;
                let isPasswordFilled = false;

                const currentEmailInput = document.getElementById('currentEmail');
                const newEmailInput = document.getElementById('newEmail');
                const passwordInput = document.getElementById('password');
                const submitBtn = document.getElementById('submitBtn');
                const currentEmailValidation = document.getElementById('currentEmailValidation');
                const emailValidation = document.getElementById('emailValidation');
                const form = document.getElementById('emailChangeForm');

                function updateSubmitButton() {
                    const shouldEnable = isCurrentEmailFilled && isNewEmailValid && isPasswordFilled;
                    console.log('Updating submit button:', {
                        isCurrentEmailFilled,
                        isNewEmailValid,
                        isPasswordFilled,
                        shouldEnable
                    });
                    submitBtn.disabled = !shouldEnable;
                }

                function checkNewEmail(email) {
                    const currentEmail = currentEmailInput.value.trim();
                    
                    if (!email) {
                        emailValidation.textContent = '';
                        emailValidation.className = 'validation-message';
                        newEmailInput.className = '';
                        isNewEmailValid = false;
                        updateSubmitButton();
                        return;
                    }
                    
                    if (email === currentEmail) {
                        emailValidation.textContent = 'New email must be different from current email';
                        emailValidation.className = 'validation-message error';
                        newEmailInput.className = 'input-error';
                        isNewEmailValid = false;
                        updateSubmitButton();
                        return;
                    }

                    emailValidation.textContent = 'Checking email availability...';
                    emailValidation.className = 'validation-message loading';
                    newEmailInput.className = '';
                    const link = 'https://' + HOST_IP + ':3030/api/auth/check-email?email=' + email;
                    fetch(link)
                        .then(response => {
                            console.log(link);
                            console.log('Response status:', response.status, 'OK:', response.ok);
                            if (!response.ok) {
                                throw new Error('HTTP ' + response.status);
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log('Email check response:', data);
                            console.log('data.exists:', data.exists, 'is available:', data.exists === false);
                            
                            if (data.exists === false) {
                                emailValidation.textContent = '✓ Email is available';
                                emailValidation.className = 'validation-message success';
                                newEmailInput.className = 'input-valid';
                                isNewEmailValid = true;
                                console.log('Email is available, isNewEmailValid set to true');
                            } else {
                                emailValidation.textContent = 'Email is already in use';
                                emailValidation.className = 'validation-message error';
                                newEmailInput.className = 'input-error';
                                isNewEmailValid = false;
                                console.log('Email not available, isNewEmailValid set to false');
                            }
                            updateSubmitButton();
                        })
                        .catch(error => {
                            console.log('Fetch error:', error);
                            emailValidation.textContent = 'Error checking email: ' + error.message;
                            emailValidation.className = 'validation-message error';
                            newEmailInput.className = 'input-error';
                            isNewEmailValid = false;
                            updateSubmitButton();
                        });
                }

                // Current email input validation
                currentEmailInput.addEventListener('input', function() {
                    const email = this.value.trim();
                    isCurrentEmailFilled = email.length > 0 && email.includes('@');
                    
                    if (isCurrentEmailFilled) {
                        currentEmailValidation.textContent = '✓ Current email entered';
                        currentEmailValidation.className = 'validation-message success';
                        currentEmailInput.className = 'input-valid';
                    } else {
                        currentEmailValidation.textContent = email.length > 0 ? 'Please enter a valid email' : '';
                        currentEmailValidation.className = 'validation-message error';
                        currentEmailInput.className = email.length > 0 ? 'input-error' : '';
                    }
                    
                    updateSubmitButton();
                    
                    // Re-check new email if current email changes
                    if (newEmailInput.value.trim()) {
                        checkNewEmail(newEmailInput.value.trim());
                    }
                });

                // New email input validation
                newEmailInput.addEventListener('input', function() {
                    clearTimeout(emailCheckTimeout);
                    const email = this.value.trim();
                    
                    if (email) {
                        emailCheckTimeout = setTimeout(() => checkNewEmail(email), 500);
                    } else {
                        emailValidation.textContent = '';
                        emailValidation.className = 'validation-message';
                        newEmailInput.className = '';
                        isNewEmailValid = false;
                        updateSubmitButton();
                    }
                });

                // Password input validation
                passwordInput.addEventListener('input', function() {
                    isPasswordFilled = this.value.trim().length > 0;
                    updateSubmitButton();
                });

                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    if (!isCurrentEmailFilled || !isNewEmailValid || !isPasswordFilled) {
                        return;
                    }

                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Processing...';

                    const formData = new FormData(form);
                    const data = {
                        token: formData.get('token'),
                        oldEmail: formData.get('oldEmail'),
                        newEmail: formData.get('newEmail'),
                        password: formData.get('password')
                    };

                    fetch('https://' + HOST_IP + ':3030/api/auth/process-email-change', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            document.getElementById('form-screen').style.display = 'none';
                            document.getElementById('success-screen').style.display = 'block';
                        } else {
                            alert('Error: ' + (data.error || 'Unknown error'));
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Change Email';
                        }
                    })
                    .catch(error => {
                        alert('Network error occurred');
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Change Email';
                    });
                });
                </script>
            </body>
            </html>
        `;

        return reply.type('text/html').send(htmlForm);
    } catch (error) {
        console.log('Show email change form error:', error);
        return reply.type('text/html').code(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Email Change - Error</title>
                <meta charset="UTF-8">
            </head>
            <body>
                <h2>Error</h2>
                <p>An error occurred while processing your request.</p>
            </body>
            </html>
        `);
    }
}

export default
{
    checkUsername,
    checkEmail,
    getProfile,
    showEmailChangeForm
};
