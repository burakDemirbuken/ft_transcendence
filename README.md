# 🎮 Transcendence - Authentication System

## 🚀 Quick Start

### **Start All Services:**
```bash
cd backend/
sudo docker-compose up --build -d
```

### **Access Points:**
- **Frontend/API:** https://localhost:8080
- **Direct Gateway:** http://localhost:3000
- **Auth Service:** Internal (port 3001)
- **Email Service:** Internal (port 3005)

## 📋 Service Status
```bash
# Check all services
sudo docker ps

# Check logs
sudo docker logs authentication -f
sudo docker logs email -f
```

## 🔧 Development Commands

### **Database Reset:**
```bash
sudo docker exec authentication rm -f /app/data/auth.db
sudo docker restart authentication
```

### **Service Restart:**
```bash
sudo docker restart authentication
sudo docker restart email
sudo docker restart gateway
sudo docker restart nginx
```

### **Full Rebuild:**
```bash
sudo docker-compose down
sudo docker-compose up --build -d
```

## 📚 Documentation

- **Frontend Integration:** [`FRONTEND_API_GUIDE.md`](./FRONTEND_API_GUIDE.md)
- **Authentication Service:** [`backend/authentication/README.md`](./backend/authentication/README.md)

## 🧪 Test User Data

**Register Test:**
```json
{
  "username": "testuser",
  "email": "your-real-email@gmail.com", 
  "password": "TestPassword123"
}
```

**Login Test:**
```json
{
  "login": "your-real-email@gmail.com",
  "password": "TestPassword123"
}
```

## 🎯 Current Features

- ✅ User registration with email verification
- ✅ Secure login with 2FA
- ✅ JWT authentication with httpOnly cookies
- ✅ HTML error pages (user-friendly)
- ✅ Email notifications (3 types)
- ✅ Memory-based verification storage
- ✅ Automatic token/code cleanup
- ✅ Already-logged-in protection
- ✅ Real email sending (Gmail SMTP)

## 🔗 API Base URL
```
https://localhost:8080/api/auth
```

Ready for frontend integration! 🚀
