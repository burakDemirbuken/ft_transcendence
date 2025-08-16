import dotenv from 'dotenv'

dotenv.config()

export const config = {
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || 'forty2transcendence@gmail.com',
    pass: process.env.EMAIL_PASS || 'gfyk pfqi gvpm ahtx',
    from: process.env.EMAIL_FROM || 'Transcendence <forty2transcendence@gmail.com>'
  },
  server: {
    port: process.env.EMAIL_PORT || 3005,
    host: process.env.HOST || '0.0.0.0',
  },
  app: {
    name: 'ft_transcendence',
    url: process.env.APP_URL || 'http://localhost:3000'
  }
}
