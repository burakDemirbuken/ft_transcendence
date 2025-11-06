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
                <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
                <meta http-equiv="Pragma" content="no-cache">
                <meta http-equiv="Expires" content="0">
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
                        <p><strong>Important:</strong> You will be logged out for security reasons.</p>
                        <p><small>Redirecting to login page in 3 seconds...</small></p>
                    </div>
                </div>

                <script>
                console.log('✅ Email Change Form Loaded - Version: v8-REGEX-FIX-ESCAPED-BACKSLASH');
                const HOST_IP = '${process.env.HOST_IP}';
                let emailCheckTimeout;
                let currentEmailTimeout;
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

                function updateSubmitButton()
                {
                    // Real-time validation: check actual input values
                    const currentEmail = currentEmailInput.value.trim();
                    const newEmail = newEmailInput.value.trim();
                    const password = passwordInput.value.trim();

                    console.log('🔘 updateSubmitButton called');
                    console.log('  📧 Current:', currentEmail);
                    console.log('  📧 New:', newEmail);
                    console.log('  🔑 Password:', password ? '***' : '(empty)');

                    // Validate current email
                    const isCurrentValid = currentEmail.length > 0 && /^[^\\s@]+@[^\\s@]+\\.[a-zA-Z]{2,}$/.test(currentEmail);

                    // Validate new email
                    const isNewValid = newEmail.length > 0 && /^[^\\s@]+@[^\\s@]+\\.[a-zA-Z]{2,}$/.test(newEmail);

                    // Check if emails are different
                    const isDifferent = currentEmail !== newEmail;

                    // Password must be filled
                    const hasPassword = password.length > 0;

                    console.log('  ✓ isCurrentValid:', isCurrentValid);
                    console.log('  ✓ isNewValid:', isNewValid);
                    console.log('  ✓ isDifferent:', isDifferent);
                    console.log('  ✓ hasPassword:', hasPassword);
                    console.log('  ✓ isCurrentEmailFilled:', isCurrentEmailFilled);
                    console.log('  ✓ isNewEmailValid:', isNewEmailValid);
                    console.log('  ✓ isPasswordFilled:', isPasswordFilled);

                    // Enable button only if all conditions are met
                    const shouldEnable = isCurrentValid && isNewValid && isDifferent && hasPassword && isCurrentEmailFilled && isNewEmailValid && isPasswordFilled;
                    console.log('  🎯 Button should be enabled:', shouldEnable);

                    submitBtn.disabled = !shouldEnable;
                }

                function isValidEmail(email) {
                    // Email validation: must contain @ and a domain with at least 2 characters after dot
                    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[a-zA-Z]{2,}$/;
                    const result = emailRegex.test(email);
                    console.log('🔎 isValidEmail:', email, '-> Result:', result, '| Regex:', emailRegex);
                    return result;
                }

                function checkNewEmail(email) {
                    console.log('🔍 checkNewEmail called with:', email);
                    const currentEmail = currentEmailInput.value.trim();
                    console.log('📧 Current email:', currentEmail);

                    if (!email) {
                        console.log('❌ Email is empty');
                        emailValidation.textContent = '';
                        emailValidation.className = 'validation-message';
                        newEmailInput.className = '';
                        isNewEmailValid = false;
                        updateSubmitButton();
                        return;
                    }

                    // Email format validation
                    const isValid = isValidEmail(email);
                    console.log('🔎 Email format check:', email, '-> Valid:', isValid);

                    if (!isValid) {
                        console.log('❌ Invalid email format');
                        emailValidation.textContent = 'Please enter a valid email address (e.g., user@example.com)';
                        emailValidation.className = 'validation-message error';
                        newEmailInput.className = 'input-error';
                        isNewEmailValid = false;
                        updateSubmitButton();
                        return;
                    }

                    if (email === currentEmail) {
                        console.log('❌ Emails are the same');
                        emailValidation.textContent = 'New email must be different from current email';
                        emailValidation.className = 'validation-message error';
                        newEmailInput.className = 'input-error';
                        isNewEmailValid = false;
                        updateSubmitButton();
                        return;
                    }

                    console.log('🌐 Fetching email availability from API...');
                    emailValidation.textContent = 'Checking email availability...';
                    emailValidation.className = 'validation-message loading';
                    newEmailInput.className = '';
                    const link = 'https://' + HOST_IP + ':3030/api/auth/check-email?email=' + email;
                    console.log('🔗 API URL:', link);

                    fetch(link)
                        .then(response => {
                            console.log('📡 API Response status:', response.status, response.ok);
                            if (!response.ok) {
                                console.log('❌ API request failed');
                                emailValidation.textContent = 'Email validation failed';
                                emailValidation.className = 'validation-message error';
                                newEmailInput.className = 'input-error';
                                isNewEmailValid = false;
                                updateSubmitButton();
                                return null;
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log('📦 API Response data:', data);
                            if (!data) return;

                            // exists: true means email is already taken
                            // exists: false means email is available
                            console.log('🔍 Email exists in DB:', data.exists);

                            if (!data.exists) {  // Email is available (not exists)
                                console.log('✅ Email is available');
                                emailValidation.textContent = '✓ Email is available';
                                emailValidation.className = 'validation-message success';
                                newEmailInput.className = 'input-valid';
                                isNewEmailValid = true;
                            } else {  // Email already exists in database
                                console.log('❌ Email already in use');
                                emailValidation.textContent = 'Email is already in use';
                                emailValidation.className = 'validation-message error';
                                newEmailInput.className = 'input-error';
                                isNewEmailValid = false;
                            }
                            console.log('🎯 isNewEmailValid set to:', isNewEmailValid);
                            updateSubmitButton();
                        })
                        .catch(error => {
                            console.log('💥 API Error:', error);
                            emailValidation.textContent = 'Could not verify email availability';
                            emailValidation.className = 'validation-message error';
                            newEmailInput.className = 'input-error';
                            isNewEmailValid = false;
                            updateSubmitButton();
                        });
                }

                // Current email input validation
                currentEmailInput.addEventListener('input', function() {
                    clearTimeout(currentEmailTimeout);
                    const email = this.value.trim();
                    console.log('⌨️ Current email input:', email);

                    // Clear validation while typing
                    if (email.length > 0) {
                        currentEmailValidation.textContent = '';
                        currentEmailValidation.className = 'validation-message';
                        currentEmailInput.className = '';
                        isCurrentEmailFilled = false;
                        updateSubmitButton();
                    }

                    if (email.length === 0) {
                        console.log('📧 Current email cleared');
                        currentEmailValidation.textContent = '';
                        currentEmailValidation.className = 'validation-message';
                        currentEmailInput.className = '';
                        isCurrentEmailFilled = false;
                        updateSubmitButton();
                        return;
                    }

                    // Validate after user stops typing
                    currentEmailTimeout = setTimeout(() => {
                        console.log('⏱️ Current email timeout fired, validating:', email);
                        isCurrentEmailFilled = /^[^\\s@]+@[^\\s@]+\\.[a-zA-Z]{2,}$/.test(email);
                        console.log('✅ isCurrentEmailFilled:', isCurrentEmailFilled);

                        if (isCurrentEmailFilled) {
                            currentEmailValidation.textContent = '✓ Current email entered';
                            currentEmailValidation.className = 'validation-message success';
                            currentEmailInput.className = 'input-valid';
                        } else {
                            currentEmailValidation.textContent = 'Please enter a valid email address (e.g., user@example.com)';
                            currentEmailValidation.className = 'validation-message error';
                            currentEmailInput.className = 'input-error';
                        }

                        updateSubmitButton();

                        // Re-check new email if current email changes
                        if (newEmailInput.value.trim()) {
                            console.log('🔄 Re-checking new email because current email changed');
                            checkNewEmail(newEmailInput.value.trim());
                        }
                    }, 800);
                });

                // New email input validation
                newEmailInput.addEventListener('input', function() {
                    clearTimeout(emailCheckTimeout);
                    const email = this.value.trim();

                    // Clear previous validation state while typing
                    if (email.length > 0) {
                        emailValidation.textContent = '';
                        emailValidation.className = 'validation-message';
                        newEmailInput.className = '';
                        isNewEmailValid = false;
                        updateSubmitButton();
                    }

                    if (email) {
                        emailCheckTimeout = setTimeout(() => checkNewEmail(email), 800);
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

                    // Final validation before submit
                    const currentEmail = currentEmailInput.value.trim();
                    const newEmail = newEmailInput.value.trim();
                    const password = passwordInput.value.trim();

                    // Validate current email format
                    if (!currentEmail || !/^[^\\s@]+@[^\\s@]+\\.[a-zA-Z]{2,}$/.test(currentEmail)) {
                        alert('Please enter a valid current email address');
                        return;
                    }

                    // Validate new email format
                    if (!newEmail || !/^[^\\s@]+@[^\\s@]+\\.[a-zA-Z]{2,}$/.test(newEmail)) {
                        alert('Please enter a valid new email address');
                        return;
                    }

                    // Check if emails are different
                    if (currentEmail === newEmail) {
                        alert('New email must be different from current email');
                        return;
                    }

                    // Check password
                    if (!password) {
                        alert('Please enter your password');
                        return;
                    }

                    if (!isCurrentEmailFilled || !isNewEmailValid || !isPasswordFilled) {
                        alert('Please complete all fields correctly');
                        return;
                    }

                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Processing...';

                    const formData = new FormData(form);
                    const data = {
                        token: formData.get('token'),
                        oldEmail: currentEmail,
                        newEmail: newEmail,
                        password: password
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
                            console.log('✅ Email change successful');
                            console.log('📧 Logout flag:', data.logout);

                            document.getElementById('form-screen').style.display = 'none';
                            document.getElementById('success-screen').style.display = 'block';

                            // Ana pencereyi login sayfasına yönlendir ve bu sekmeyi kapat
                            setTimeout(() => {
                                if (window.opener && !window.opener.closed) {
                                    console.log('👉 Redirecting opener window to login');
                                    window.opener.location.href = 'https://' + HOST_IP + ':3030/login';
                                    window.close();
                                } else {
                                    console.log('👉 No opener, redirecting current window');
                                    window.location.href = 'https://' + HOST_IP + ':3030/login';
                                }
                            }, 2000);
                        } else {
                            alert('Error: ' + (data.error || 'Unknown error'));
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Change Email';
                        }
                    })
                    .catch(error => {
                        console.error('❌ Network error:', error);
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

async function showPasswordChangeForm(request, reply) {
    const trlt = getTranslations(request.query.lang || "eng");
    try {
        const { token } = request.query;

        // Token'ı kontrol et - hangi email için olduğunu bul
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
                        <p>The password change link is invalid or has expired.</p>
                        <p>Please request a new password change from your account settings.</p>
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
                <title>Change Password</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
                <meta http-equiv="Pragma" content="no-cache">
                <meta http-equiv="Expires" content="0">
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
                    input[type="password"] {
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
                    .success-screen {
                        text-align: center;
                        display: none;
                    }
                    .success-screen h3 {
                        color: #4caf50;
                    }
                    .password-requirements {
                        font-size: 13px;
                        color: #666;
                        margin-top: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div id="form-screen">
                        <h2>Change Password</h2>

                        <div class="info">
                            <strong>Password Change Request</strong>
                            <br><br>
                            Please enter your current password and choose a new password.
                        </div>

                        <form id="passwordChangeForm">
                            <input type="hidden" name="token" value="${token}">

                            <div class="form-group">
                                <label for="currentPassword">Current Password:</label>
                                <input type="password" id="currentPassword" name="currentPassword" required autocomplete="current-password">
                                <div id="currentPasswordValidation" class="validation-message"></div>
                            </div>

                            <div class="form-group">
                                <label for="newPassword">New Password:</label>
                                <input type="password" id="newPassword" name="newPassword" required autocomplete="new-password">
                                <div class="password-requirements">
                                    Password must be at least 8 characters long
                                </div>
                                <div id="newPasswordValidation" class="validation-message"></div>
                            </div>

                            <div class="form-group">
                                <label for="confirmPassword">Confirm New Password:</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" required autocomplete="new-password">
                                <div id="confirmPasswordValidation" class="validation-message"></div>
                            </div>

                            <button type="submit" id="submitBtn" disabled>Change Password</button>
                        </form>
                    </div>

                    <div id="success-screen" class="success-screen">
                        <h3>✅ Password Successfully Changed!</h3>
                        <p>Your password has been updated successfully.</p>
                        <p><strong>Important:</strong> You will be logged out for security reasons.</p>
                        <p><small>Redirecting to login page in 3 seconds...</small></p>
                    </div>
                </div>

                <script>
                console.log('✅ Password Change Form Loaded - Version: v2-FIX-HOST-IP');
                const HOST_IP = '${process.env.HOST_IP}';
                let isCurrentPasswordFilled = false;
                let isNewPasswordValid = false;
                let isConfirmPasswordValid = false;

                const currentPasswordInput = document.getElementById('currentPassword');
                const newPasswordInput = document.getElementById('newPassword');
                const confirmPasswordInput = document.getElementById('confirmPassword');
                const submitBtn = document.getElementById('submitBtn');
                const currentPasswordValidation = document.getElementById('currentPasswordValidation');
                const newPasswordValidation = document.getElementById('newPasswordValidation');
                const confirmPasswordValidation = document.getElementById('confirmPasswordValidation');
                const form = document.getElementById('passwordChangeForm');

                function updateSubmitButton() {
                    const currentPassword = currentPasswordInput.value.trim();
                    const newPassword = newPasswordInput.value.trim();
                    const confirmPassword = confirmPasswordInput.value.trim();

                    console.log('🔘 updateSubmitButton called');
                    console.log('  🔑 Current Password:', currentPassword ? '***' : '(empty)');
                    console.log('  🔑 New Password:', newPassword ? '***' : '(empty)');
                    console.log('  🔑 Confirm Password:', confirmPassword ? '***' : '(empty)');

                    const hasCurrentPassword = currentPassword.length > 0;
                    const hasNewPassword = newPassword.length >= 8;
                    const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
                    const isDifferent = currentPassword !== newPassword;

                    console.log('  ✓ hasCurrentPassword:', hasCurrentPassword);
                    console.log('  ✓ hasNewPassword (>=8):', hasNewPassword);
                    console.log('  ✓ passwordsMatch:', passwordsMatch);
                    console.log('  ✓ isDifferent:', isDifferent);
                    console.log('  ✓ isCurrentPasswordFilled:', isCurrentPasswordFilled);
                    console.log('  ✓ isNewPasswordValid:', isNewPasswordValid);
                    console.log('  ✓ isConfirmPasswordValid:', isConfirmPasswordValid);

                    const shouldEnable = hasCurrentPassword && hasNewPassword && passwordsMatch && isDifferent &&
                                       isCurrentPasswordFilled && isNewPasswordValid && isConfirmPasswordValid;
                    console.log('  🎯 Button should be enabled:', shouldEnable);

                    submitBtn.disabled = !shouldEnable;
                }

                // Current password validation
                currentPasswordInput.addEventListener('input', function() {
                    const password = this.value.trim();
                    isCurrentPasswordFilled = password.length > 0;

                    if (isCurrentPasswordFilled) {
                        currentPasswordValidation.textContent = '✓ Current password entered';
                        currentPasswordValidation.className = 'validation-message success';
                        currentPasswordInput.className = 'input-valid';
                    } else {
                        currentPasswordValidation.textContent = '';
                        currentPasswordValidation.className = 'validation-message';
                        currentPasswordInput.className = '';
                    }

                    updateSubmitButton();
                });

                // New password validation
                newPasswordInput.addEventListener('input', function() {
                    const password = this.value.trim();
                    const currentPassword = currentPasswordInput.value.trim();

                    if (password.length === 0) {
                        newPasswordValidation.textContent = '';
                        newPasswordValidation.className = 'validation-message';
                        newPasswordInput.className = '';
                        isNewPasswordValid = false;
                    } else if (password.length < 8) {
                        newPasswordValidation.textContent = 'Password must be at least 8 characters';
                        newPasswordValidation.className = 'validation-message error';
                        newPasswordInput.className = 'input-error';
                        isNewPasswordValid = false;
                    } else if (password === currentPassword) {
                        newPasswordValidation.textContent = 'New password must be different from current password';
                        newPasswordValidation.className = 'validation-message error';
                        newPasswordInput.className = 'input-error';
                        isNewPasswordValid = false;
                    } else {
                        newPasswordValidation.textContent = '✓ Valid password';
                        newPasswordValidation.className = 'validation-message success';
                        newPasswordInput.className = 'input-valid';
                        isNewPasswordValid = true;
                    }

                    // Re-validate confirm password
                    if (confirmPasswordInput.value.trim()) {
                        const event = new Event('input');
                        confirmPasswordInput.dispatchEvent(event);
                    }

                    updateSubmitButton();
                });

                // Confirm password validation
                confirmPasswordInput.addEventListener('input', function() {
                    const password = this.value.trim();
                    const newPassword = newPasswordInput.value.trim();

                    if (password.length === 0) {
                        confirmPasswordValidation.textContent = '';
                        confirmPasswordValidation.className = 'validation-message';
                        confirmPasswordInput.className = '';
                        isConfirmPasswordValid = false;
                    } else if (password !== newPassword) {
                        confirmPasswordValidation.textContent = 'Passwords do not match';
                        confirmPasswordValidation.className = 'validation-message error';
                        confirmPasswordInput.className = 'input-error';
                        isConfirmPasswordValid = false;
                    } else {
                        confirmPasswordValidation.textContent = '✓ Passwords match';
                        confirmPasswordValidation.className = 'validation-message success';
                        confirmPasswordInput.className = 'input-valid';
                        isConfirmPasswordValid = true;
                    }

                    updateSubmitButton();
                });

                form.addEventListener('submit', function(e) {
                    e.preventDefault();

                    const currentPassword = currentPasswordInput.value.trim();
                    const newPassword = newPasswordInput.value.trim();
                    const confirmPassword = confirmPasswordInput.value.trim();

                    // Final validation
                    if (!currentPassword) {
                        alert('Please enter your current password');
                        return;
                    }

                    if (newPassword.length < 8) {
                        alert('New password must be at least 8 characters long');
                        return;
                    }

                    if (newPassword !== confirmPassword) {
                        alert('Passwords do not match');
                        return;
                    }

                    if (currentPassword === newPassword) {
                        alert('New password must be different from current password');
                        return;
                    }

                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Processing...';

                    const formData = new FormData(form);
                    const token = formData.get('token');
                    console.log('📝 Form Data:');
                    console.log('  🎫 Token:', token);
                    console.log('  🎫 Token length:', token ? token.length : 0);
                    console.log('  🔑 Current Password:', currentPassword ? '***' : '(empty)');
                    console.log('  🔑 New Password:', newPassword ? '***' : '(empty)');

                    const data = {
                        token: token,
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    };

                    console.log('📤 Sending data:', JSON.stringify(data, null, 2));

                    fetch('https://' + HOST_IP + ':3030/api/auth/process-password-change', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            console.log('✅ Password change successful');
                            console.log('🔐 Logout flag:', data.logout);

                            document.getElementById('form-screen').style.display = 'none';
                            document.getElementById('success-screen').style.display = 'block';

                            // Ana pencereyi login sayfasına yönlendir ve bu sekmeyi kapat
                            setTimeout(() => {
                                if (window.opener && !window.opener.closed) {
                                    console.log('👉 Redirecting opener window to login');
                                    window.opener.location.href = 'https://' + HOST_IP + ':3030/login';
                                    window.close();
                                } else {
                                    console.log('👉 No opener, redirecting current window');
                                    window.location.href = 'https://' + HOST_IP + ':3030/login';
                                }
                            }, 2000);
                        } else {
                            alert('Error: ' + (data.error || 'Unknown error'));
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Change Password';
                        }
                    })
                    .catch(error => {
                        console.error('❌ Network error:', error);
                        alert('Network error occurred');
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Change Password';
                    });
                });
                </script>
            </body>
            </html>
        `;

        return reply.type('text/html').send(htmlForm);
    } catch (error) {
        console.log('Show password change form error:', error);
        return reply.type('text/html').code(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Password Change - Error</title>
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
    showEmailChangeForm,
    showPasswordChangeForm
};
