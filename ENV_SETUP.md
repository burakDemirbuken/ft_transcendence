# Environment Variables Setup 🔐

## ⚠️ CRITICAL SECURITY REQUIREMENT

**According to the 42 project requirements:**
> "For obvious security reasons, any credentials, API keys, env variables etc., must be saved locally in a .env file and ignored by git. Publicly stored credentials will cause your project to fail."

**This means:**
- ❌ NO credentials in source code
- ❌ NO secrets in git repository
- ✅ ALL secrets in `.env` file
- ✅ `.env` is in `.gitignore`

## Setup Instructions

### 1. Copy the Example File
```bash
cp .env.example .env
```

### 2. Edit `.env` with Your Real Credentials

```bash
nano .env
# or
vim .env
```

### 3. Required Configuration

#### JWT Secret
Generate a secure random string (at least 32 characters):
```bash
openssl rand -base64 32
```
Then paste it in `.env`:
```
JWT_SECRET=your-generated-secret-here
```

#### Email Configuration
For Gmail, you need an **App Password** (NOT your regular password):

1. Go to your Google Account
2. Security → 2-Step Verification (enable it)
3. Security → App passwords
4. Generate password for "Mail"
5. Copy the 16-character password

Then add to `.env`:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=your-email@gmail.com
```

#### Database Configuration
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=transcendence
```

### 4. Verify Setup

Check that `.env` is properly ignored:
```bash
git status
# .env should NOT appear in the list
```

Check that all required variables are set:
```bash
cat .env | grep -v "^#" | grep -v "^$"
```

## What's Protected

All services now use environment variables:

- ✅ **Authentication Service** - JWT secret from `.env`
- ✅ **Email Service** - Gmail credentials from `.env`
- ✅ **Gateway** - JWT secret from `.env`
- ✅ **All Services** - Database credentials from `.env`

## Docker Compose Integration

All services automatically load `.env`:
```yaml
services:
  authentication:
    env_file:
      - .env
    environment:
      - JWT_SECRET=${JWT_SECRET}
```

## Files Overview

- `.env` - Your actual credentials (NEVER commit!)
- `.env.example` - Template file (safe to commit)
- `.gitignore` - Contains `.env` (prevents accidental commits)

## Troubleshooting

### Error: "JWT_SECRET environment variable is required"
→ Check that `.env` exists and contains `JWT_SECRET=...`

### Error: "EMAIL_PASS is not set"
→ Add your Gmail App Password to `.env`

### Environment variables not loading
→ Rebuild containers: `docker-compose down && docker-compose up --build`

## Production Deployment

For production, generate strong secrets:
```bash
# JWT Secret
openssl rand -base64 32

# Database Password
openssl rand -base64 24

# Session Secret
openssl rand -base64 32
```

## Security Checklist

- [ ] `.env` file created with real credentials
- [ ] `.env` is in `.gitignore`
- [ ] `.env` NOT committed to git
- [ ] JWT_SECRET is at least 32 characters
- [ ] Email uses App Password (not regular password)
- [ ] Database password is strong
- [ ] `git status` does NOT show `.env`

---

**Remember:** If `.env` is committed to git, the project will FAIL the evaluation! ⚠️
