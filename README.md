# 🧠 ft_trans## 🔐 Güvenlik Özellikleri

- **2FA (Two-Factor Authentication)**: Email ile doğrulama kodu
- **JWT Token Sistemi**: Access (1.5 saat) + Refresh Token (6 saat/30 gün)
- **HttpOnly Cookies**: XSS saldırılarına karşı koruma
- **Token Blacklisting**: Logout sonrası token geçersizleştirme
- **IP ve User-Agent Takibi**: Session güvenliği
- **Güvenli Hesap Silme**: 2FA ile korumalı kalıcı hesap silmee Backend - SQLite + Fastify API

Bu proje, Fastify.js ile yazılmış güvenli bir RESTful API sunar. 2FA doğrulaması, JWT token sistemi ve cookie-based authentication ile kullanıcı yönetimi sağlar.

## 📦 Kurulum

Docker üzerinden çalıştırmak için:

```bash
make build
make up
```

## � Güvenlik Özellikleri

- **2FA (Two-Factor Authentication)**: Email ile doğrulama kodu
- **JWT Token Sistemi**: Access (1.5 saat) + Refresh Token (6 saat/30 gün)
- **HttpOnly Cookies**: XSS saldırılarına karşı koruma
- **Token Blacklisting**: Logout sonrası token geçersizleştirme
- **IP ve User-Agent Takibi**: Session güvenliği

## �🚀 API Kullanımı
Tüm istekler `http://localhost:3000/api/users` ile başlar.

## 📋 API Endpoints

### 🔍 1. Username Kontrol
**URL:** `/api/users/checkUsername?username=johnDoe`  
**Method:** `GET`

**Yanıt:**
```json
{
  "exists": true,
  "message": "Bu kullanıcı adı zaten alınmış"
}
```

### 📧 2. Email Kontrol
**URL:** `/api/users/checkEmail?email=user@example.com`  
**Method:** `GET`

**Yanıt:**
```json
{
  "exists": false,
  "message": "E-posta adresi kullanılabilir"
}
```

### 🔐 3. Kayıt Ol (Register)
**URL:** `/api/users/register`  
**Method:** `POST`

**İstek:**
```json
{
  "username": "johnDoe",
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Yanıt:**
```json
{
  "message": "Kayıt başarılı",
  "userId": 1
}
```

### 🔑 4. Giriş Yap (Login)
**URL:** `/api/users/login`  
**Method:** `POST`

**İstek:**
```json
{
  "username": "johnDoe",
  "password": "securePassword123"
}
```

**Yanıt:**
```json
{
  "message": "2FA kodu gönderildi. Lütfen e-posta kutunuzu kontrol edin.",
  "email": "user@example.com"
}
```

### ✅ 5. 2FA Doğrulama
**URL:** `/api/users/verify-2fa`  
**Method:** `POST`

**İstek:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "rememberMe": false
}
```

**Yanıt:**
```json
{
  "message": "Giriş başarılı - Token'lar cookie olarak set edildi",
  "debug": {
    "accessTokenCookie": true,
    "refreshTokenCookie": true,
    "accessExpiry": 5400,
    "refreshExpiry": 21600
  }
}
```

### � 6. Profil Bilgileri
**URL:** `/api/users/me`  
**Method:** `GET`  
**Authentication:** Required (Cookie veya Bearer Token)

**Yanıt:**
```json
{
  "id": 1,
  "username": "johnDoe",
  "email": "user@example.com"
}
```

### 🔄 7. Token Yenile
**URL:** `/api/users/refresh-token`  
**Method:** `POST`  
**Authentication:** Refresh Token Cookie Required

**Yanıt:**
```json
{
  "message": "Token yenilendi",
  "debug": {
    "newAccessTokenSet": true,
    "expires": 5400
  }
}
```

### 🚪 8. Çıkış Yap (Logout)
**URL:** `/api/users/logout`  
**Method:** `POST`  
**Authentication:** Required

**Yanıt:**
```json
{
  "message": "Çıkış başarılı",
  "info": "Tüm cookie'ler temizlendi"
}
```

### 🗑️ 9. Hesap Sil (2FA ile)
**URL:** `/api/users/delete-account`  
**Method:** `DELETE`  
**Authentication:** Required

**1. Adım - Silme İsteği:**
**Yanıt:**
```json
{
  "message": "2FA kodu gönderildi. Hesabınızı silmek için e-posta kutunuzu kontrol edin.",
  "email": "user@example.com",
  "warning": "Bu işlem geri alınamaz!"
}
```

**2. Adım - 2FA Doğrulama:**
**URL:** `/api/users/verify-2fa`  
**Method:** `POST`

**İstek:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Yanıt:**
```json
{
  "message": "Hesabınız başarıyla silindi",
  "info": "Tüm verileriniz kalıcı olarak silindi"
}
```

## 🕒 Token Süreleri

| Token Türü | Normal Süre | Remember Me |
|------------|-------------|-------------|
| Access Token | 1.5 saat | 1.5 saat |
| Refresh Token | 6 saat | 30 gün |

## 🧪 Test Etmek İçin Örnek curl Komutları

### Username Kontrol:
```bash
curl -X GET "http://localhost:3000/api/users/checkUsername?username=johnDoe"
```

### Email Kontrol:
```bash
curl -X GET "http://localhost:3000/api/users/checkEmail?email=user@example.com"
```

### Kayıt:
```bash
curl -X POST http://localhost:3000/api/users/register \
-H "Content-Type: application/json" \
-d '{"username":"johnDoe","email":"user@example.com","password":"securePassword123"}'
```

### Giriş:
```bash
curl -X POST http://localhost:3000/api/users/login \
-H "Content-Type: application/json" \
-d '{"username":"johnDoe","password":"securePassword123"}'
```

### 2FA Doğrulama:
```bash
curl -X POST http://localhost:3000/api/users/verify-2fa \
-H "Content-Type: application/json" \
-d '{"email":"user@example.com","code":"123456","rememberMe":false}' \
-c cookies.txt
```

### Profil Bilgisi (Cookie ile):
```bash
curl -X GET http://localhost:3000/api/users/me \
-b cookies.txt
```

### Token Yenile:
```bash
curl -X POST http://localhost:3000/api/users/refresh-token \
-b cookies.txt
```

### Çıkış:
```bash
curl -X POST http://localhost:3000/api/users/logout \
-b cookies.txt
```

### Hesap Silme (2FA ile):
```bash
# 1. Silme isteği gönder
curl -X DELETE http://localhost:3000/api/users/delete-account \
-b cookies.txt

# 2. Email'den aldığın kodu ile doğrula
curl -X POST http://localhost:3000/api/users/verify-2fa \
-H "Content-Type: application/json" \
-d '{"email":"user@example.com","code":"123456"}' \
-b cookies.txt
```

## 🗃️ Veritabanı

SQLite veritabanı kullanılmaktadır:
- **users** tablosu: Kullanıcı bilgileri
- **tokens** tablosu: Refresh token'lar ve session bilgileri

## 🌐 CORS ve Cookie Ayarları

- **HttpOnly Cookies**: JavaScript ile erişilemez
- **Secure**: Production'da HTTPS zorunlu
- **SameSite**: CSRF saldırılarına karşı koruma
- **Domain**: Subdomain desteği

## 📧 Email Servisi

Gmail SMTP kullanılarak:
- 2FA kodları
- Giriş bildirimleri
- Hesap silme doğrulama kodları
- Güvenlik uyarıları

## 🔧 Environment Variables

```env
JWT_SECRET=your_super_secret_jwt_key_here
COOKIE_SECRET=your_cookie_secret_key_here
PORT=3000
HOST=0.0.0.0
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 🚀 Production Deploy

1. Environment variables'ları ayarla
2. `NODE_ENV=production` set et
3. HTTPS sertifikası ekle
4. Rate limiting aktifleştir

---

## 💡 Önemli Notlar

- **2FA zorunludur** - Tüm girişlerde email doğrulaması gerekir
- **Cookie-based authentication** - Frontend'de token yönetimi otomatik
- **Automatic token refresh** - Access token sürekli yenilenir
- **Session security** - IP ve User-Agent takibi yapılır
- **Memory blacklisting** - Logout olan token'lar geçersizleşir
- **Güvenli hesap silme** - 2FA ile korumalı kalıcı veri silme işlemi