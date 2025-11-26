import dotenv from 'dotenv'

dotenv.config()

// Email şifresi ZORUNLU - .env'de olmalı
if (!process.env.EMAIL_PASS) {
  console.error('❌ CRITICAL: EMAIL_PASS is not set in .env file!');
  console.error('   Email service will NOT work without this.');
  console.error('   Please set EMAIL_PASS in your .env file');
  process.exit(1); // Email olmadan servis çalışmamalı
}

if (!process.env.EMAIL_USER) {
  console.error('❌ CRITICAL: EMAIL_USER is not set in .env file');
  process.exit(1);
}

export const config = {
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || `Transcendence <${process.env.EMAIL_USER}>`
  },
  server: {
    port: process.env.EMAIL_PORT || 3005,
    host: process.env.HOST || '0.0.0.0',
  }
}
