import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/sendEmail.js';
import {
  createUser,
  findUserById,
  findUserByEmail,
  findUserByUsername,
  deleteUser,
  isRefreshSessionValid,
  deleteRefreshSession
} from '../models/userModel.js';
import {
  storeToken,
  isTokenActive,
  deactivateToken,
  deleteAllUserTokens
} from '../models/tokenModel.js';

// Fastify instance'ını global olarak tutmak için
let fastifyInstance;

export const setFastifyInstance = (instance) => {
  fastifyInstance = instance;
};

const generate2FACode = () => Math.floor(100000 + Math.random() * 900000).toString();
const pending2FA = new Map();

// Access token blacklist (memory'de - kısa süreliler için)
const blacklistedAccessTokens = new Set();

// Access token'ı blacklist'e ekle
const addAccessTokenToBlacklist = (token) => {
  blacklistedAccessTokens.add(token);
  // 1.6 saat sonra otomatik temizle (token süresi 1.5h + 6 dakika buffer)
  setTimeout(() => {
    blacklistedAccessTokens.delete(token);
  }, 1.6 * 60 * 60 * 1000); // 1.6 saat
};

// Access token blacklist kontrolü
export const isAccessTokenBlacklisted = (token) => {
  return blacklistedAccessTokens.has(token);
};

export const register = async (request, reply) => {
  const { username, email, password } = request.body;
  if (!username || !email || !password) {
    return reply.code(400).send({ error: 'Eksik alan var' });
  }

  try {
    // Email kontrolü
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return reply.code(409).send({ error: 'Bu e-posta adresi zaten kayıtlı' });
    }

    // Username kontrolü
    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return reply.code(409).send({ error: 'Bu kullanıcı adı zaten alınmış' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userId = await createUser({ username, email, password: hashed });
    reply.send({ message: 'Kayıt başarılı', userId });
  } catch (err) {
    reply.code(500).send({ error: 'Sunucu hatası', detail: err.message });
  }
};

export const loginUser = async (request, reply) => {
  const { username, password } = request.body;
  const ip = request.ip;
  const userAgent = request.headers['user-agent'] || 'unknown';

  try {
    const user = await findUserByUsername(username);
    if (!user) return reply.code(401).send({ error: 'Geçersiz kullanıcı adı veya şifre' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return reply.code(401).send({ error: 'Geçersiz kullanıcı adı veya şifre' });

    // 2FA'yı her zaman zorunlu yapıyoruz
    const code = generate2FACode();
    pending2FA.set(user.email, { code, ip, userAgent, createdAt: Date.now(), action: 'login' });

    await sendEmail(user.email, 'Giriş Kodu', `Kodunuz: ${code}`);
    reply.send({ 
      message: '2FA kodu gönderildi. Lütfen e-posta kutunuzu kontrol edin.',
      email: user.email // Frontend'e hangi email'e kod gönderildiğini bildirmek için
    });

  } catch (err) {
    reply.code(500).send({ error: 'Sunucu hatası', detail: err.message });
  }
};

export const verify2FA = async (request, reply) => {
  const { email, code, rememberMe = false } = request.body;
  const ip = request.ip;
  const userAgent = request.headers['user-agent'] || 'unknown';

  const record = pending2FA.get(email);
  if (!record || record.code !== code) {
    return reply.code(401).send({ error: 'Kod hatalı veya süresi doldu' });
  }

  // 5 dakika timeout kontrolü
  const now = Date.now();
  if (now - record.createdAt > 5 * 60 * 1000) {
    pending2FA.delete(email);
    return reply.code(401).send({ error: 'Kod süresi doldu' });
  }

  try {
    const user = await findUserByEmail(email);

    // Action'a göre farklı işlemler yap
    if (record.action === 'delete') {
      // Hesap silme işlemi
      await deleteAllUserTokens(user.id);
      await deleteUser(user.id);
      pending2FA.delete(email);

      // Cookie'leri temizle
      reply.clearCookie('accessToken');
      reply.clearCookie('refreshToken');

      await sendEmail(email, '✅ Hesap Silindi', 
        `Hesabınız başarıyla silindi. IP: ${ip}, Tarayıcı: ${userAgent}`
      );

      return reply.send({
        message: 'Hesabınız başarıyla silindi',
        info: 'Tüm verileriniz kalıcı olarak silindi'
      });
    }

    // Normal login işlemi (action === 'login' veya undefined)
    const accessToken = await reply.jwtSign({ id: user.id }, { expiresIn: '1.5h' });
    const refreshExpiresIn = rememberMe ? '30d' : '6h';
    const refreshToken = await reply.jwtSign({ id: user.id }, { expiresIn: refreshExpiresIn });

    // Sadece storeToken kullan (storeRefreshSession duplicate yaratır)
    const refreshExpiry = Math.floor(Date.now() / 1000) + (rememberMe ? 30 * 24 * 60 * 60 : 6 * 60 * 60); // 30 gün veya 6 saat

    await storeToken({
      userId: user.id,
      token: refreshToken,
      tokenType: 'refresh',
      expiresAt: refreshExpiry,
      ipAddress: ip,
      userAgent: userAgent
    });

    pending2FA.delete(email);

    // Cookie süreleri
    const cookieExpiry = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000; // 30 gün veya 6 saat (ms cinsinden)

    // Access token'ı da cookie olarak set et (opsiyonel)
    reply.setCookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1.5 * 60 * 60 * 1000, // 1.5 saat
      path: '/'
    });

    // Refresh token'ı HttpOnly cookie olarak set et
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieExpiry,
      path: '/'
    });

    // Debug için cookie set edildi mi kontrol et
    reply.send({
      message: "Giriş başarılı - Token'lar cookie olarak set edildi",
      debug: {
        accessTokenCookie: true,
        refreshTokenCookie: true,
        accessExpiry: 1.5 * 60 * 60, // 1.5 saat (saniye cinsinden)
        refreshExpiry: cookieExpiry / 1000
      }
    });
    await sendEmail(email, 'Giriş Başarılı', `Sisteme giriş yaptınız: IP: ${ip}, Tarayıcı: ${userAgent}`);

  } catch (err) {
    reply.code(500).send({ error: 'Sunucu hatası', detail: err.message });
  }
};

export const getProfile = async (request, reply) => {
  try {
    const user = await findUserById(request.user.id);
    if (!user) return reply.code(404).send({ error: 'Kullanıcı bulunamadı' });
    reply.send({ id: user.id, username: user.username, email: user.email });
  } catch (err) {
    reply.code(500).send({ error: 'Sunucu hatası', detail: err.message });
  }
};

export const refreshAccessToken = async (request, reply) => {
  const ip = request.ip;
  const userAgent = request.headers['user-agent'] || 'unknown';

  // Refresh token'ı cookie'den al
  const refreshToken = request.cookies.refreshToken;

  if (!refreshToken) {
    return reply.code(400).send({ error: 'Refresh token cookie bulunamadı' });
  }

  try {
    // Refresh token'ın veritabanında aktif olup olmadığını kontrol et
    const isActive = await isTokenActive(refreshToken);
    if (!isActive) {
      // Cookie'yi temizle
      reply.clearCookie('refreshToken');
      return reply.code(401).send({ error: 'Refresh token geçersiz (logout edilmiş veya süresi dolmuş)' });
    }

    // JWT'yi manuel doğrula
    const decoded = fastifyInstance.jwt.verify(refreshToken);

    // Veritabanından refresh token'ın geçerli olup olmadığını kontrol et
    const valid = await isRefreshSessionValid({
      token: refreshToken,
      userId: decoded.id,
      ip,
      userAgent,
    });

    if (!valid) {
      reply.clearCookie('refreshToken');
      return reply.code(401).send({ error: 'Refresh token session geçersiz' });
    }

    // Yeni access token oluştur ve cookie olarak set et
    const newAccessToken = await reply.jwtSign({ id: decoded.id }, { expiresIn: '1.5h' });

    reply.setCookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1.5 * 60 * 60 * 1000, // 1.5 saat
      path: '/'
    });

    reply.send({
      message: "Token yenilendi",
      debug: {
        newAccessTokenSet: true,
        expires: 1.5 * 60 * 60 // 1.5 saat (saniye cinsinden)
      }
    });

  } catch (err) {
    reply.clearCookie('refreshToken');
    reply.code(401).send({ error: 'Token doğrulanamadı', detail: err.message });
  }
};

export const logoutUser = async (request, reply) => {
  const userId = request.user.id;

  try {
    // Access token'ı cookie'den veya header'dan al
    let accessToken = null;
    if (request.cookies.accessToken) {
      accessToken = request.cookies.accessToken;
    } else if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
      accessToken = request.headers.authorization.substring(7);
    }

    // Access token'ı memory blacklist'e ekle
    if (accessToken) {
      addAccessTokenToBlacklist(accessToken);
    }

    // Cookie'den refresh token al ve veritabanında deaktive et
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken) {
      await deactivateToken(refreshToken);
    }

    // Kullanıcının tüm session'larını da sil
    await deleteRefreshSession({ userId });

    // Her iki cookie'yi de temizle
    reply.clearCookie('accessToken');
    reply.clearCookie('refreshToken');

    reply.send({
      message: 'Çıkış başarılı',
      info: 'Tüm cookie\'ler temizlendi'
    });
  } catch (err) {
    reply.code(500).send({ error: 'Sunucu hatası', detail: err.message });
  }
};

export const checkUsername = async (request, reply) => {
  const { username } = request.query;
  if (!username) {
    return reply.code(400).send({ error: 'Kullanıcı adı gerekli' });
  }

  try {
    const user = await findUserByUsername(username);
    if (user) {
      return reply.send({ exists: true, message: 'Bu kullanıcı adı zaten alınmış' });
    }
    reply.send({ exists: false, message: 'Kullanıcı adı kullanılabilir' });
  } catch (err) {
    reply.code(500).send({ error: 'Sunucu hatası', detail: err.message });
  }
};

export const checkEmail = async (request, reply) => {
  const { email } = request.query;
  if (!email) {
    return reply.code(400).send({ error: 'E-posta adresi gerekli' });
  }

  try {
    const user = await findUserByEmail(email);
    if (user) {
      return reply.send({ exists: true, message: 'Bu e-posta adresi zaten kayıtlı' });
    }
    reply.send({ exists: false, message: 'E-posta adresi kullanılabilir' });
  } catch (err) {
    reply.code(500).send({ error: 'Sunucu hatası', detail: err.message });
  }
};

export const deleteAccount = async (request, reply) => {
  const userId = request.user.id;
  const ip = request.ip;
  const userAgent = request.headers['user-agent'] || 'unknown';

  try {
    const user = await findUserById(userId);
    if (!user) {
      return reply.code(404).send({ error: 'Kullanıcı bulunamadı' });
    }

    // 2FA kodu oluştur ve gönder
    const code = generate2FACode();
    pending2FA.set(user.email, { 
      code, 
      ip, 
      userAgent, 
      createdAt: Date.now(), 
      action: 'delete',
      userId: userId 
    });

    await sendEmail(user.email, '⚠️ Hesap Silme Doğrulaması', 
      `Hesabınızı kalıcı olarak silmek için doğrulama kodunuz: ${code}\n\nBu işlem geri alınamaz!`
    );

    reply.send({
      message: '2FA kodu gönderildi. Hesabınızı silmek için e-posta kutunuzu kontrol edin.',
      email: user.email,
      warning: 'Bu işlem geri alınamaz!'
    });

  } catch (err) {
    reply.code(500).send({ error: 'Sunucu hatası', detail: err.message });
  }
};
