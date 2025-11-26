import dotenv from 'dotenv'

dotenv.config()

if (!process.env.EMAIL_PASS) {
  console.error('❌ CRITICAL: EMAIL_PASS is not set in .env file!');
  process.exit(1);
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
    port: parseInt(process.env.EMAIL_PORT) || 3005,
    host: process.env.HOST || '0.0.0.0',
  }
}
