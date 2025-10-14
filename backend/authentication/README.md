# 🔐 Transcendence Authentication Microservice

## 📝 Service Overview
Modern, secure authentication microservice with email verification and 2FA support.

## 🏗️ Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Nginx Proxy   │────│   Gateway       │
│   (Any Tech)    │    │   (Port 8080)   │    │   (Port 3000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Authentication │────│  Email Service  │
                       │  (Port 3001)    │    │  (Port 3005)    │
                       └─────────────────┘    └─────────────────┘
                               │
                       ┌─────────────────┐
                       │   SQLite DB     │
                       │   (auth.db)     │
                       └─────────────────┘
```

## 🚀 Quick Start

### **Development Setup:**
```bash
cd backend/
sudo docker-compose up --build -d
```

### **Production Deployment:**
```bash
# Build images
sudo docker-compose build

# Start services
sudo docker-compose up -d

# Check status
sudo docker ps
```

## 📊 Database Schema

### **Users Table** (Optimized 8-field design)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,                    -- bcrypt hashed
  is_active BOOLEAN DEFAULT FALSE,           -- email verification status
  last_login_at DATETIME,                    -- login tracking
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username);
```

## 🔧 Configuration

### **Environment Variables:**
```env
# Authentication Service
JWT_SECRET=your_super_secure_jwt_secret_here
EMAIL_SERVICE_URL=http://email:3005

# Email Service  
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Database
DB_PATH=/app/data/auth.db
```

### **Docker Compose Services:**
```yaml
services:
  authentication:
    build: ./authentication
    ports: ["3001"]
    volumes: ["./authentication/data:/app/data"]
    
  email:
    build: ./email  
    ports: ["3005"]
    
  gateway:
    build: ./gateway
    ports: ["3000:3000"]
    
  nginx:
    build: ./nginx
    ports: ["8080:8080"]
```

## 🔒 Security Features

### **Password Security:**
- ✅ bcrypt hashing (salt rounds: 12)
- ✅ Minimum 8 characters required
- ✅ No plain text storage

### **JWT Tokens:**
- ✅ 24-hour expiration
- ✅ HttpOnly cookies
- ✅ Secure & SameSite flags
- ✅ User payload: `{userId, username, email}`

### **Rate Limiting & Protection:**
- ✅ Already-logged-in detection
- ✅ Token/code expiration (30min/10min)
- ✅ Memory cleanup (5min intervals)
- ✅ Input validation & sanitization

### **Email Verification:**
- ✅ Inactive users until verification
- ✅ Secure 32-byte hex tokens
- ✅ Click-to-verify workflow

### **Two-Factor Authentication:**
- ✅ 6-digit numeric codes  
- ✅ Email delivery
- ✅ Time-limited validity
- ✅ Login attempt notifications

## 📧 Email Integration

### **Supported Email Types:**
1. **Registration Verification**
   - Trigger: User registers
   - Content: Welcome + verification link
   - Action: Account activation

2. **2FA Authentication**  
   - Trigger: User login attempt
   - Content: 6-digit security code
   - Action: Login completion

3. **Login Notification**
   - Trigger: Successful 2FA verification
   - Content: Security notification + IP
   - Action: Security awareness

### **Email Service Endpoints:**
```javascript
// Internal service calls
POST email:3005/send-verification
POST email:3005/send-2fa  
POST email:3005/send-login-notification
```

## 🧪 Testing & Debugging

### **Log Monitoring:**
```bash
# Authentication service logs
sudo docker logs authentication -f

# Email service logs
sudo docker logs email -f

# All service logs
sudo docker-compose logs -f
```

### **Database Inspection:**
```bash
# Access database
sudo docker exec -it authentication sh
cd /app/data
sqlite3 auth.db

# Quick queries
.tables
SELECT * FROM users;
SELECT COUNT(*) FROM users;
```

### **Memory Storage Debug:**
```javascript
// Check verification codes (in AuthController.js)
console.log('Current tempStorage:', [...tempStorage.entries()]);
```

### **Common Test Scenarios:**
```bash
# Fresh database start
sudo docker exec authentication rm -f /app/data/auth.db
sudo docker restart authentication

# Test user registration
curl -X POST https://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"TestPass123"}' \
  -k
```

## 🔗 API Endpoints Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/health` | Service status | ❌ |
| GET | `/check-username` | Username availability | ❌ |
| GET | `/check-email` | Email availability | ❌ |
| POST | `/register` | User registration | ❌ |
| GET | `/verify-email` | Email verification | ❌ |
| POST | `/login` | User login (2FA trigger) | ❌ |
| POST | `/verify-2fa` | 2FA verification | ❌ |
| GET | `/profile` | User profile | ✅ |
| POST | `/logout` | User logout | ✅ |

## 📈 Performance Metrics

### **Current Optimization:**
- 🗄️ **Database:** 28KB SQLite, 8-field schema
- 🧠 **Memory:** Map-based verification storage  
- ⚡ **Response Time:** <50ms (local), <200ms (with email)
- 📧 **Email Delivery:** ~1-2 seconds via Gmail SMTP

### **Scalability Considerations:**
- Memory storage → Redis for production
- SQLite → PostgreSQL for high load
- Email queue for bulk operations
- Rate limiting per IP/user

## 🚦 Service Status

### **Health Indicators:**
- ✅ Database connection
- ✅ Email service connectivity  
- ✅ JWT secret configuration
- ✅ Memory cleanup process

### **Monitoring Commands:**
```bash
# Service health
curl -k https://localhost:8080/api/auth/health

# Container status
sudo docker ps | grep -E "(authentication|email|gateway|nginx)"

# Resource usage
sudo docker stats --no-stream
```

## 🔄 Development Workflow

### **Code Changes:**
```bash
# After code modification
sudo docker restart authentication

# Full rebuild
sudo docker-compose up --build -d authentication
```

### **Database Schema Changes:**
```bash
# Reset database
sudo docker exec authentication rm -f /app/data/auth.db
sudo docker restart authentication
```

### **Config Changes:**
```bash
# Restart affected services
sudo docker-compose restart
```

---

## 📱 Frontend Integration Examples

### **Registration Flow:**
```javascript
const registerUser = async (userData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Show "check email" message
    showMessage('Kayıt başarılı! Email adresinizi kontrol edin.');
    redirectToLogin();
  } else {
    // Handle error (might be HTML response for some errors)
    showError(result.error);
  }
};
```

### **Login with 2FA Flow:**
```javascript
const loginUser = async (credentials) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  const result = await response.json();
  
  if (result.success && result.next_step === '2fa_verification') {
    // Show 2FA input form
    show2FAForm(result.email);
    showMessage('2FA kodu email adresinize gönderildi!');
  }
};

const verify2FA = async (email, code) => {
  const response = await fetch('/api/auth/verify-2fa', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // JWT cookie automatically set
    redirectToDashboard();
  }
};
```

### **Authentication Check:**
```javascript
const checkAuth = async () => {
  try {
    const response = await fetch('/api/auth/profile', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.user; // User is authenticated
    }
  } catch (error) {
    // User not authenticated
    return null;
  }
};
```

---

*🎮 Ready for frontend integration!*
*Backend team: Authentication microservice complete*
