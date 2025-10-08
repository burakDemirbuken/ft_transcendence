import User from '../models/User.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

/**
 * Memory-based storage for temporary data
 */
const tempStorage = new Map(); // email -> { code, expires, type }

/**
 * Email Service Integration
 */
async function sendVerificationEmail(email, username, token) {
  try {
    const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://email:3005';
    const verificationUrl = `https://localhost:8080/api/auth/verify-email?token=${token}`;

    const response = await fetch(`${emailServiceUrl}/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        username: username,
        verificationUrl: verificationUrl,
        token: token
      })
    });

    if (!response.ok) {
      throw new Error(`Email service responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`📧 Verification email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('📧 Verification email send failed:', error);
    throw error;
  }
}

async function send2FAEmail(email, username, code, userIP) {
  try {
    const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://email:3005';

    const response = await fetch(`${emailServiceUrl}/send-2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        username: username,
        code: code,
        ip: userIP,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Email service responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`📧 2FA email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('📧 2FA email send failed:', error);
    throw error;
  }
}

async function sendLoginNotification(email, username, userIP) {
  try {
    const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://email:3005';

    const response = await fetch(`${emailServiceUrl}/send-login-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        username: username,
        ip: userIP,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Email service responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`📧 Login notification sent to ${email}`);
    return result;
  } catch (error) {
    console.error('📧 Login notification send failed:', error);
    throw error;
  }
}

/**
 * Generate secure verification token
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate 6-digit verification code for 2FA
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate secure refresh token
 */
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Store verification token in memory (for email verification)
 */
function storeVerificationToken(email, type = 'email_verification') {
  const token = generateVerificationToken();
  const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes for token (longer than code)

  tempStorage.set(email, { token, expires, type });
  console.log(`🔐 Verification token stored for ${email}: ${token} (expires: ${expires})`);

  return token;
}

/**
 * Store verification code in memory (for 2FA)
 */
function storeVerificationCode(email, type = '2fa') {
  const code = generateVerificationCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for codes

  tempStorage.set(email, { code, expires, type });
  console.log(`🔐 Verification code stored for ${email}: ${code} (expires: ${expires})`);

  return code;
}

// Cleanup expired codes and unverified users every 5 minutes
setInterval(async () => {
  const now = new Date();
  const cleanupResults = {
    expiredTokens: 0,
    unverifiedUsers: 0
  };

  // Clean expired tokens from memory
  for (const [email, data] of tempStorage.entries()) {
    if (data.expires < now) {
      tempStorage.delete(email);
      cleanupResults.expiredTokens++;
    }
  }

  try {
    // Clean unverified users older than 30 minutes
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const deletedCount = await User.destroy({
      where: {
        is_active: false,
        created_at: {
          [Op.lt]: thirtyMinutesAgo
        }
      }
    });

    cleanupResults.unverifiedUsers = deletedCount;

    if (cleanupResults.expiredTokens > 0 || cleanupResults.unverifiedUsers > 0) {
      console.log(`🧹 Cleanup completed:`, cleanupResults);
    }
  } catch (error) {
    console.error('🧹 Cleanup error:', error);
  }
}, 5 * 60 * 1000);

/**
 * Generate HTML response for user-friendly pages
 */
function generateHTML(title, message, type = 'info', redirectUrl = null, redirectDelay = 3000) {
  const colors = {
    success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
    info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' },
    warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' }
  };

  const color = colors[type] || colors.info;
  const redirectScript = redirectUrl ?
    `<script>setTimeout(function() { window.location.href = '${redirectUrl}'; }, ${redirectDelay});</script>` : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 ${title} - Transcendence</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            text-align: center;
            max-width: 500px;
        }
        .message-box {
            background: ${color.bg};
            border: 2px solid ${color.border};
            color: ${color.text};
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
        }
        .logo { font-size: 48px; margin-bottom: 20px; }
        h1 { color: #1976d2; margin-bottom: 10px; }
        .btn {
            display: inline-block;
            background: #1976d2;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 20px;
            cursor: pointer;
        }
        .btn:hover { background: #1565c0; }
        .countdown { font-size: 14px; color: #666; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎮</div>
        <h1>${title}</h1>
        <div class="message-box">${message}</div>
        ${redirectUrl ? `
            <a href="${redirectUrl}" class="btn">← Ana Sayfaya Dön</a>
            <div class="countdown">Otomatik yönlendirme: <span id="countdown">${redirectDelay/1000}</span> saniye</div>
        ` : ''}
    </div>
    ${redirectScript}
    ${redirectUrl ? `
    <script>
        let seconds = ${redirectDelay/1000};
        const countdown = document.getElementById('countdown');
        const timer = setInterval(function() {
            seconds--;
            countdown.textContent = seconds;
            if (seconds <= 0) clearInterval(timer);
        }, 1000);
    </script>
    ` : ''}
</body>
</html>`;
}

/**
 * Simplified Authentication Controller
 * Core functionality only: register, login, logout, profile
 */
class AuthController {

  // HEALTH CHECK
  async health(request, reply) {
    reply.send({
      success: true,
      service: 'authentication-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }

  // CHECK USERNAME AVAILABILITY
  async checkUsername(request, reply) {
    try {
      const { username } = request.query;

      if (!username) {
        return reply.status(400).send({
          success: false,
          error: 'Username parameter is required'
        });
      }

      const user = await User.findByUsername(username);

      reply.send({
        exists: !!user,
        message: user ? 'Bu kullanıcı adı zaten alınmış' : 'Kullanıcı adı kullanılabilir'
      });

    } catch (error) {
      console.log('Check username error:', error);
      reply.status(500).send({
        success: false,
        error: 'Username check failed'
      });
    }
  }

  // CHECK EMAIL AVAILABILITY
  async checkEmail(request, reply) {
    try {
      const { email } = request.query;

      if (!email) {
        return reply.status(400).send({
          success: false,
          error: 'Email parameter is required'
        });
      }

      const user = await User.findByEmail(email);

      reply.send({
        exists: !!user,
        message: user ? 'Bu e-posta adresi zaten kullanılıyor' : 'E-posta adresi kullanılabilir'
      });

    } catch (error) {
      console.log('Check email error:', error);
      reply.status(500).send({
        success: false,
        error: 'Email check failed'
      });
    }
  }

  // REGISTER NEW USER
  async register(request, reply) {
    try {
      const { username, email, password } = request.body;

      // Basic validation
      if (!username || !email || !password) {
        const html = generateHTML(
          'Kayıt Hatası',
          '❌ Lütfen tüm alanları doldurun!<br><br><strong>Gereken alanlar:</strong><br>• Kullanıcı adı<br>• Email<br>• Şifre',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(400).type('text/html; charset=utf-8').send(html);
      }

      // Check if user exists
      const existingUser = await User.findByEmail(email) || await User.findByUsername(username);
      if (existingUser) {
        const html = generateHTML(
          'Kayıt Hatası',
          '❌ Bu kullanıcı zaten mevcut!<br><br>Farklı bir kullanıcı adı veya email adresi deneyin.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(409).type('text/html; charset=utf-8').send(html);
      }

      // Create user (inactive until email verification)
      const newUser = await User.create({
        username,
        email: email.toLowerCase(),
        password,
        is_active: false // Inactive until email verification
      });

      // Generate and store email verification token
      const verificationToken = storeVerificationToken(email, 'email_verification');

      // Send verification email
      try {
        await sendVerificationEmail(email, username, verificationToken);

        reply.status(201).send({
          success: true,
          message: 'User registered successfully. Please check your email for verification code.',
          user: newUser.toSafeObject(),
          next_step: 'email_verification'
        });

      } catch (emailError) {
        console.log('Email send failed, cleaning up user:', emailError);

        // Email gönderilemezse kullanıcıyı sil
        await User.destroy({ where: { id: newUser.id } });
        tempStorage.delete(email); // Token'ı da temizle

        const html = generateHTML(
          'Email Hatası',
          '❌ Email doğrulama kodu gönderilemedi!<br><br>Bu email adresi geçerli olmayabilir veya email servisi kullanılamıyor.<br><br>Lütfen geçerli bir email adresi ile tekrar deneyin.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(400).type('text/html; charset=utf-8').send(html);
      }

    } catch (error) {
      console.log('Register error:', error);
      const html = generateHTML(
        'Kayıt Hatası',
        '❌ Sistem hatası! Kayıt işlemi başarısız oldu.<br><br>Lütfen daha sonra tekrar deneyin.',
        'error',
        'https://localhost:8080',
        5000
      );
      return reply.status(500).type('text/html; charset=utf-8').send(html);
    }
  }

  // EMAIL VERIFICATION (Both GET with token in URL and POST with token in body)
  async verifyEmail(request, reply) {
    try {
      console.log('🔍 Email verification attempt:', request.method, request.url);
      console.log('🔍 Query params:', request.query);
      console.log('🔍 Body params:', request.body);

      // Support both GET (?token=xxx) and POST ({token: xxx})
      const token = request.query.token || request.body.token;

      console.log('🔍 Extracted token:', token ? token.substring(0, 10) + '...' : 'NOT FOUND');

      if (!token) {
        const html = generateHTML(
          'Doğrulama Hatası',
          '❌ Doğrulama tokeni bulunamadı!<br><br>Lütfen emailinizdeki doğrulama linkine tıklayın.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(400).type('text/html; charset=utf-8').send(html);
      }

      console.log('🔍 Searching in tempStorage, current size:', tempStorage.size);

      // Find email by token (since token is unique)
      let storedData = null;
      let userEmail = null;

      for (const [emailKey, data] of tempStorage.entries()) {
        if (data.token === token && data.type === 'email_verification') {
          storedData = data;
          userEmail = emailKey;
          break;
        }
      }

      if (!storedData) {
        const html = generateHTML(
          'Doğrulama Hatası',
          '❌ Geçersiz veya süresi dolmuş doğrulama tokeni!<br><br>Lütfen yeniden kayıt olun.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(400).type('text/html; charset=utf-8').send(html);
      }

      // Check if expired
      if (storedData.expires < new Date()) {
        tempStorage.delete(userEmail);
        const html = generateHTML(
          'Doğrulama Hatası',
          '⏰ Doğrulama tokeninin süresi dolmuş!<br><br>Lütfen yeniden kayıt olun.',
          'warning',
          'https://localhost:8080',
          5000
        );
        return reply.status(400).type('text/html; charset=utf-8').send(html);
      }

      // Activate user
      const user = await User.findByEmail(userEmail);
      if (!user) {
        const html = generateHTML(
          'Doğrulama Hatası',
          '❌ Kullanıcı bulunamadı!<br><br>Hesap silinmiş olabilir.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(404).type('text/html; charset=utf-8').send(html);
      }

      user.is_active = true;
      await user.save();

      // Remove verification token from memory
      tempStorage.delete(userEmail);

      // For GET requests, return HTML page
      if (request.method === 'GET') {
        reply.type('text/html; charset=utf-8').send(`
          <!DOCTYPE html>
          <html lang="tr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>✅ Email Doğrulandı - Transcendence</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                text-align: center;
                margin: 0;
                padding: 50px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #333;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 15px;
                max-width: 500px;
                margin: 0 auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              }
              .success-icon { font-size: 64px; margin-bottom: 20px; }
              h1 { color: #2e7d32; margin-bottom: 10px; }
              p { color: #666; line-height: 1.6; }
              .btn {
                background: #1976d2;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                display: inline-block;
                margin-top: 30px;
                font-weight: bold;
                transition: background 0.3s;
              }
              .btn:hover { background: #1565c0; }
              .user-info {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success-icon">🎉</div>
              <h1>Email Başarıyla Doğrulandı!</h1>
              <div class="user-info">
                <p><strong>Kullanıcı:</strong> ${user.username}</p>
                <p><strong>Email:</strong> ${user.email}</p>
              </div>
              <p>Tebrikler! Email adresiniz doğrulandı. Artık Transcendence'e giriş yapabilirsiniz.</p>
              <a href="https://localhost:8080/login" class="btn">🚀 Transcendence'e Giriş Yap</a>
            </div>
            <script>
              // 5 saniye sonra otomatik redirect
              setTimeout(() => {
                window.location.href = 'https://localhost:8080/login';
              }, 5000);
            </script>
          </body>
          </html>
        `);
      } else {
        // For POST requests, return JSON
        reply.send({
          success: true,
          message: 'Email verified successfully! You can now login.',
          user: user.toSafeObject()
        });
      }

    } catch (error) {
      console.log('Email verification error:', error);
      const html = generateHTML(
        'Doğrulama Hatası',
        '❌ Email doğrulama işlemi sırasında hata oluştu!<br><br>Lütfen daha sonra tekrar deneyin.',
        'error',
        'https://localhost:8080',
        5000
      );
      return reply.status(500).type('text/html; charset=utf-8').send(html);
    }
  }

  // LOGIN USER
  async login(request, reply) {
    try {
      // Check if user is already logged in
      try {
        await request.jwtVerify();
        const html = generateHTML(
          'Zaten Giriş Yapılmış',
          '⚠️ Zaten giriş yapmışsınız!<br><br>Önce çıkış yapmanız gerekiyor.',
          'warning',
          'https://localhost:8080',
          3000
        );
        return reply.status(400).type('text/html; charset=utf-8').send(html);
      } catch (err) {
        // Not logged in, continue with login process
      }

      const { login, password } = request.body;

      if (!login || !password) {
        const html = generateHTML(
          'Giriş Hatası',
          '❌ Email/kullanıcı adı ve şifre gerekli!<br><br>Lütfen tüm alanları doldurun.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(400).type('text/html; charset=utf-8').send(html);
      }

      // Find user by email or username
      const user = await User.findByEmail(login) || await User.findByUsername(login);

      if (!user) {
        const html = generateHTML(
          'Giriş Hatası',
          '❌ Geçersiz email/kullanıcı adı veya şifre!<br><br>Lütfen bilgilerinizi kontrol edin.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(401).type('text/html; charset=utf-8').send(html);
      }

      // Check password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        const html = generateHTML(
          'Giriş Hatası',
          '❌ Geçersiz email/kullanıcı adı veya şifre!<br><br>Lütfen bilgilerinizi kontrol edin.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(401).type('text/html; charset=utf-8').send(html);
      }

      // Check if email is verified
      if (!user.is_active) {
        const html = generateHTML(
          'Email Doğrulaması Gerekli',
          '📧 Önce email adresinizi doğrulamanız gerekiyor!<br><br>Lütfen email kutunuzu kontrol edin.',
          'warning',
          'https://localhost:8080',
          5000
        );
        return reply.status(403).type('text/html; charset=utf-8').send(html);
      }

      // Generate and send 2FA code
      const twoFACode = storeVerificationCode(user.email, '2fa');

      // Get user's IP for security email
      const userIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress || 'Unknown';

      try {
        // Send 2FA code
        await send2FAEmail(user.email, user.username, twoFACode, userIP);
      } catch (emailError) {
        console.log('2FA email send failed:', emailError);
      }

      reply.send({
        success: true,
        message: 'Login initiated. Please check your email for 2FA code.',
        next_step: '2fa_verification',
        email: user.email
      });

    } catch (error) {
      console.log('Login error:', error);
      const html = generateHTML(
        'Giriş Hatası',
        '❌ Sistem hatası! Giriş işlemi başarısız oldu.<br><br>Lütfen daha sonra tekrar deneyin.',
        'error',
        'https://localhost:8080',
        5000
      );
      return reply.status(500).type('text/html; charset=utf-8').send(html);
    }
  }

  // 2FA VERIFICATION
// 2FA VERIFICATION (username OR email)
  async verify2FA(request, reply) {
    try {
      const { login, code, rememberMe = false } = request.body;
    
      if (!login || !code) {
        const html = generateHTML(
          '2FA Doğrulama Hatası',
          '❌ Email/kullanıcı adı ve 2FA kodu gerekli!<br><br>Lütfen tüm alanları doldurun.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(400).type('text/html; charset=utf-8').send(html);
      }
    
      // Find user by email or username
      const user = await User.findByEmail(login) || await User.findByUsername(login);
      if (!user) {
        const html = generateHTML(
          '2FA Doğrulama Hatası',
          '❌ Kullanıcı bulunamadı!<br><br>Lütfen bilgilerinizi kontrol edin.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(404).type('text/html; charset=utf-8').send(html);
      }
    
      // Check stored 2FA code (always stored by user.email)
      const storedData = tempStorage.get(user.email);
      if (!storedData || storedData.type !== '2fa') {
        const html = generateHTML(
          '2FA Doğrulama Hatası',
          '❌ 2FA kodu bulunamadı!<br><br>Lütfen tekrar giriş yapmayı deneyin.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(400).type('text/html; charset=utf-8').send(html);
      }
    
      // Check if expired
      if (storedData.expires < new Date()) {
        tempStorage.delete(user.email);
        const html = generateHTML(
          '2FA Doğrulama Hatası',
          '⏰ 2FA kodunun süresi dolmuş!<br><br>Lütfen tekrar giriş yapmayı deneyin.',
          'warning',
          'https://localhost:8080',
          5000
        );
        return reply.status(400).type('text/html; charset=utf-8').send(html);
      }
    
      // Check if code matches
      if (storedData.code !== code) {
        const html = generateHTML(
          '2FA Doğrulama Hatası',
          '❌ Geçersiz 2FA kodu!<br><br>Lütfen emailinizdeki 6 haneli kodu doğru girin.',
          'error',
          'https://localhost:8080',
          5000
        );
        return reply.status(400).type('text/html; charset=utf-8').send(html);
      }
    
      // Update last login
      await user.markLogin();
    
      // Generate JWT access token (1 hour)
      const accessToken = await reply.jwtSign(
        {
          userId: user.id,
          username: user.username,
          email: user.email
        },
        { expiresIn: '1m' } // TEST: 1 minute
      );

      // Generate refresh token
      const refreshToken = generateRefreshToken();
      await user.setRefreshToken(refreshToken, rememberMe);
    
      // Set access token cookie
      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 1 * 60 * 1000 // TEST: 1 minute
      });

      // Set refresh token cookie (TEST: remember me'ye göre 4 dakika veya 10 dakika)
      const refreshTokenMaxAge = rememberMe ? 10 * 60 * 1000 : 4 * 60 * 1000;
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: refreshTokenMaxAge
      });
    
      // Remove 2FA code from memory
      tempStorage.delete(user.email);
    
      // Get user's IP for security notification
      const userIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress || 'Unknown';
    
      // Send login notification email
      try {
        await sendLoginNotification(user.email, user.username, userIP);
      } catch (emailError) {
        console.log('Login notification email failed:', emailError);
      }
    
      reply.send({
        success: true,
        message: 'Login successful',
        user: user.toSafeObject()
      });
    
    } catch (error) {
      console.log('2FA verification error:', error);
      const html = generateHTML(
        '2FA Doğrulama Hatası',
        '❌ Sistem hatası! 2FA doğrulama başarısız oldu.<br><br>Lütfen daha sonra tekrar deneyin.',
        'error',
        'https://localhost:8080',
        5000
      );
      return reply.status(500).type('text/html; charset=utf-8').send(html);
    }
  }


  // GET PROFILE
  async getProfile(request, reply) {
    try {
      const userId = request.user.userId;

      const user = await User.findByPk(userId);
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      reply.send({
        success: true,
        user: user.toSafeObject()
      });

    } catch (error) {
      console.log('Get profile error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  // LOGOUT
  async logout(request, reply) {
    try {
      // Get refresh token from cookie to identify user
      const refreshToken = request.cookies.refreshToken;

      if (refreshToken) {
        // Find user and clear refresh token from database
        const user = await User.findOne({
          where: { refresh_token: refreshToken }
        });

        if (user) {
          await user.clearRefreshToken();
        }
      }

      // Clear cookies
      reply.clearCookie('accessToken');
      reply.clearCookie('refreshToken');

      reply.send({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.log('Logout error:', error);
      reply.status(500).send({
        success: false,
        error: 'Logout failed'
      });
    }
  }

  // LOGOUT
}

export default new AuthController();
