# 🔒 Environment Variables & Security

## ⚠️ CRITICAL SECURITY REQUIREMENT

**From 42 Project Subject:**
> "For obvious security reasons, any credentials, API keys, env variables etc., must be saved locally in a .env file and ignored by git. Publicly stored credentials will cause your project to fail."

## 🚨 What This Means

**NEVER commit these to git:**
- API keys
- Secret keys (JWT, session, etc.)
- Passwords (database, email, etc.)
- Tokens
- Any sensitive credentials

**All secrets MUST be:**
1. ✅ Stored in `.env` file
2. ✅ Added to `.gitignore`
3. ✅ Loaded via `process.env`

## 📋 Setup Instructions

### 1. Copy the example file

```bash
cp .env.example .env
```

### 2. Edit `.env` and fill in your actual values

```bash
nano .env   # or use your preferred editor
```

### 3. Generate secure secrets

For JWT and session secrets, use strong random strings:

```bash
# Generate a secure random string (Linux/Mac)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Gmail App Password Setup

For email functionality:

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password: https://myaccount.google.com/apppasswords
4. Copy the 16-character password
5. Add to `.env`:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

## 🔐 Required Environment Variables

### Critical (MUST set)
```bash
JWT_SECRET=                    # Min 32 chars
EMAIL_USER=                    # Your Gmail address
EMAIL_PASS=                    # Gmail App Password
```

### Optional (have defaults)
```bash
HOST_IP=localhost
APP_URL=http://localhost:3000
NODE_ENV=development
```

## ✅ Verification

Check if your setup is secure:

```bash
# This should show NO results (secrets should not be in code)
grep -r "password.*=" backend/ --include="*.js" | grep -v "process.env"
grep -r "secret.*=" backend/ --include="*.js" | grep -v "process.env"

# This should show .env is ignored
git status .env
# Output should be: nothing to commit (or file not tracked)
```

## 🛡️ Security Checklist

- [ ] `.env` file created and filled
- [ ] `.env` added to `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] JWT_SECRET is at least 32 characters
- [ ] Email credentials are valid
- [ ] Verified `.env` is NOT tracked by git

## 🚫 Common Mistakes

❌ **DON'T:**
```javascript
const secret = 'my-secret-key';  // Hardcoded!
const password = 'password123';  // In code!
```

✅ **DO:**
```javascript
const secret = process.env.JWT_SECRET;
const password = process.env.DB_PASSWORD;

if (!secret) {
  throw new Error('JWT_SECRET must be set in .env');
}
```

## 📝 Project Status

Currently fixed:
- ✅ `backend/authentication/srcs/registration.js` - JWT secret now from env
- ✅ `backend/email/config/env.js` - Email credentials now from env
- ✅ `.gitignore` updated to ignore `.env`
- ✅ `.env.example` created as template

## 🔍 How to Check Before Submission

```bash
# 1. Check no .env in git
git ls-files | grep "\.env$"
# Should return nothing

# 2. Check no secrets in code
grep -r "gfyk pfqi" .
grep -r "forty2transcendence@gmail.com" . --exclude-dir=node_modules
# Should only find them in .env.example (if at all)

# 3. Check .gitignore works
git check-ignore .env
# Should return: .env
```

## ❓ FAQ

**Q: Can I commit `.env.example`?**
A: Yes! It's a template with fake/placeholder values.

**Q: What if I accidentally committed secrets?**
A: 
1. Change ALL the secrets immediately
2. Remove from git history: `git filter-branch` or BFG Repo-Cleaner
3. Force push (⚠️ careful!)

**Q: Do I need different secrets for dev/prod?**
A: Yes! Use different secrets for production.

## 📚 References

- [The Twelve-Factor App - Config](https://12factor.net/config)
- [OWASP - Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Node.js Environment Variables Best Practices](https://nodejs.dev/learn/how-to-read-environment-variables-from-nodejs)
