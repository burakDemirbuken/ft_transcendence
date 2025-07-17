# 🧠 ft_transcendence Backend - SQLite + Node.js API

Bu proje, Express.js ile yazılmış basit bir RESTful API sunar. Kullanıcılar kayıt olabilir, giriş yapabilir ve kendi bilgilerini JWT doğrulamasıyla görüntüleyebilir.

## 📦 Kurulum

Docker üzerinden çalıştırmak için:

```
make build
make up
```
## 🚀 API Kullanımı
Tüm istekler http://localhost:3000/api/users ile başlar.

## 🔐 1. Kayıt Ol (Register)
URL: /api/users/register
Method: POST

İstek:

```
{
  "username": "yunus",
  "email":"example@gmail.com
  "password": "123456"
}
```
Yanıt:
```
{
  "message": "Kullanıcı başarıyla oluşturuldu"
}
```
## 🔑 2. Giriş Yap (Login)
URL: /api/users/login
Method: POST

İstek:
```
{
  "username": "yunus",
  "email":"example@gmail.com"
  "password": "123456"
}
```
Yanıt:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...(Örnek)"
}
## 🙋 3. Kendi Kullanıcı Bilgilerini Getir
URL: /api/users/me  
    Method: GET

Header:
    Authorization: Bearer <token>
Yanıt:
```
{
  "id": 1,
  "username": "yunus"
  "email":"example@gmail.com"
  "password":"123456"
}
```
## 🧪 Test Etmek İçin Örnek curl Komutları
Kayıt:
```
curl -X POST http://localhost:3000/api/users/register \
-H "Content-Type: application/json" \
-d '{"username":"yunus","email":"example@gmail.com","password":"123456"}'
```
Giriş:
```
curl -X POST http://localhost:3000/api/users/login \
-H "Content-Type: application/json" \
-d '{"username":"yunus","email":"example@gmail.com","password":"123456"}'
```
Bilgileri Getir:
```
curl -X GET http://localhost:3000/api/users/ \
-H "Authorization: Bearer <TOKEN>"
```