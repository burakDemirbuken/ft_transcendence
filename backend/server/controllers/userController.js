import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/sendEmail.js';
import {
  createUser,
  findUserById,
  findUserByEmail,
  isRefreshSessionValid,
  deleteRefreshSession
} from '../models/userModel.js';
import {
  storeToken,
  isTokenActive,
  deactivateToken
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
  // 35 saniye sonra otomatik temizle (token süresi 30s + 5s buffer)
  setTimeout(() => {
    blacklistedAccessTokens.delete(token);
  }, 35000);
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
    const existing = await findUserByEmail(email);
    if (existing) {
      return reply.code(409).send({ error: 'Kullanıcı zaten kayıtlı' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userId = await createUser({ username, email, password: hashed });
    reply.send({ message: 'Kayıt başarılı', userId });
  } catch (err) {
    reply.code(500).send({ error: 'Sunucu hatası', detail: err.message });
  }
};

export const loginUser = async (request, reply) => {
  const { email, password } = request.body;
  const ip = request.ip;
  const userAgent = request.headers['user-agent'] || 'unknown';

  try {
    const user = await findUserByEmail(email);
    if (!user) return reply.code(401).send({ error: 'Geçersiz e-posta veya şifre' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return reply.code(401).send({ error: 'Geçersiz e-posta veya şifre' });

    // 2FA'yı her zaman zorunlu yapıyoruz
    const code = generate2FACode();
    pending2FA.set(email, { code, ip, userAgent, createdAt: Date.now() });

    await sendEmail(email, 'Giriş Kodu', `Kodunuz: ${code}`);
    reply.send({ message: '2FA kodu gönderildi. Lütfen e-posta kutunuzu kontrol edin.' });

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
    const accessToken = await reply.jwtSign({ id: user.id }, { expiresIn: '30s' });
    const refreshExpiresIn = rememberMe ? '2m' : '90s';
    const refreshToken = await reply.jwtSign({ id: user.id }, { expiresIn: refreshExpiresIn });

    // Sadece storeToken kullan (storeRefreshSession duplicate yaratır)
    const refreshExpiry = Math.floor(Date.now() / 1000) + (rememberMe ? 120 : 90);

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
    const cookieExpiry = rememberMe ? 2 * 60 * 1000 : 90 * 1000; // ms cinsinden
    
    // Access token'ı da cookie olarak set et (opsiyonel)
    reply.setCookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 1000, // 30 saniye
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
        accessExpiry: 30,
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
    const newAccessToken = await reply.jwtSign({ id: decoded.id }, { expiresIn: '30s' });
    
    reply.setCookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 1000, // 30 saniye
      path: '/'
    });

    reply.send({ 
      message: "Token yenilendi",
      debug: {
        newAccessTokenSet: true,
        expires: 30
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
