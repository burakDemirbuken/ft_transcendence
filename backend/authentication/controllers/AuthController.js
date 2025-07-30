import User from '../models/User.js';
import userRepository from '../models/UserRepository.js';

class AuthController {
  async register(req, rep) {
    try {
      const { username, email, password } = req.body;

      // Validasyon
      if (!username || !email || !password) {
        return rep.status(400).send({
          success: false,
          error: 'Username, email ve password gerekli'
        });
      }

      if (!User.validateEmail(email)) {
        return rep.status(400).send({
          success: false,
          error: 'Geçersiz email formatı'
        });
      }

      if (!User.validateUsername(username)) {
        return rep.status(400).send({
          success: false,
          error: 'Username 3-20 karakter arası olmalı'
        });
      }

      if (!User.validatePassword(password)) {
        return rep.status(400).send({
          success: false,
          error: 'Password en az 6 karakter olmalı'
        });
      }

      // Yeni user oluştur
      const newUser = new User(username, email, password);
      
      try {
        await userRepository.create(newUser);
      } catch (dbError) {
        return rep.status(409).send({
          success: false,
          error: dbError.message
        });
      }

      // JWT token oluştur
      const token = req.server.jwt.sign({
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username
      });

      // Cookie'ye token'ı set et
      rep.setCookie('accessToken', token, {
        httpOnly: true,
        secure: false, // HTTPS için true yapılmalı
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 7 gün
      });

      rep.status(201).send({
        success: true,
        message: 'Kullanıcı başarıyla kaydedildi',
        user: newUser.toSafeObject()
      });

    } catch (error) {
      req.log.error('Register error:', error);
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  async login(req, rep) {
    console.log("Login request received:", req.body);
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return rep.status(400).send({
          success: false,
          error: 'Email ve password gerekli'
        });
      }

      // Kullanıcıyı bul
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return rep.status(401).send({
          success: false,
          error: 'Geçersiz email veya şifre'
        });
      }

      // Şifre kontrolü
      if (!User.validatePassword(password, user.password)) {
        return rep.status(401).send({
          success: false,
          error: 'Geçersiz email veya şifre'
        });
      }

      // JWT token oluştur
      const token = req.server.jwt.sign({
        userId: user.id,
        email: user.email,
        username: user.username
      });

      // Cookie'ye token'ı set et
      rep.setCookie('accessToken', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 7 gün
      });

      rep.send({
        success: true,
        message: 'Giriş başarılı',
        user: user.toSafeObject()
      });

    } catch (error) {
      req.log.error('Login error:', error);
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  async logout(req, rep) {
    try {
      rep.clearCookie('accessToken');
      rep.send({
        success: true,
        message: 'Çıkış başarılı'
      });
    } catch (error) {
      req.log.error('Logout error:', error);
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  async me(req, rep) {
    try {
      // JWT middleware'den gelen user bilgisi
      const userId = req.user.userId;
      
      const user = await userRepository.findById(userId);
      if (!user) {
        return rep.status(404).send({
          success: false,
          error: 'Kullanıcı bulunamadı'
        });
      }

      rep.send({
        success: true,
        user: user.toSafeObject()
      });

    } catch (error) {
      req.log.error('Me error:', error);
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  async stats(req, rep) {
    try {
      const userCount = await userRepository.count();
      
      rep.send({
        success: true,
        stats: {
          totalUsers: userCount,
          service: 'authentication',
          version: '1.0.0'
        }
      });

    } catch (error) {
      req.log.error('Stats error:', error);
      rep.status(500).send({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }
}

export default new AuthController();
