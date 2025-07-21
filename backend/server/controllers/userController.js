import bcrypt from 'bcryptjs';
import jwt from '@fastify/jwt';
import { createUser, findUserByUsername, findUserById, findUserByEmail } from '../models/userModel.js';
import { sendEmail } from '../utils/sendEmail.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';



export const register = async (request, reply) => {
  const { username, email, password } = request.body;
  if (!username || !email || !password) {
    return reply.status(400).send({ error: 'Eksik alan var' });
  }

  try {
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return reply.status(409).send({ error: 'Kullanıcı zaten var' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await createUser({ username, email, password: hashedPassword });

    reply.send({ message: 'Kullanıcı oluşturuldu', userId });
  } catch (err) {
    reply.status(500).send({ error: 'Sunucu hatası', details: err.message });
  }
};

export const getProfile = async (request, reply) => {
  try {
    const user = await findUserById(request.user.id);
    if (!user) {
      return reply.status(404).send({ error: 'Kullanıcı bulunamadı' });
    }
    reply.send({ id: user.id, username: user.username, email: user.email });
  } catch (err) {
    reply.status(500).send({ error: 'Sunucu hatası', details: err.message });
  }
};

export const generate2FACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const pending2FA = new Map(); // Geçici bellekte tut (redis de olabilir)

export const loginUser = async (request, reply) => {
  const { email, password } = request.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) return reply.status(401).send({ error: 'Geçersiz e-posta veya şifre' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return reply.status(401).send({ error: 'Geçersiz e-posta veya şifre' });

    // 2FA kod oluştur ve gönder
    const code = generate2FACode();
    pending2FA.set(email, code); // Geçici sakla

    await sendEmail(email, 'Giriş Doğrulama Kodu', `Kodun: ${code}`);

    reply.send({ message: 'Lütfen e-posta adresinize gelen 2FA kodunu girin.' });
  } catch (err) {
    reply.status(500).send({ error: 'Sunucu hatası', details: err.message });
  }
};

export const verify2FA = async (request, reply) => {
  const { email, code } = request.body;

  const expectedCode = pending2FA.get(email);

  if (!expectedCode || expectedCode !== code) {
    return reply.code(401).send({ error: 'Kod hatalı veya süresi doldu' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return reply.code(404).send({ error: 'Kullanıcı bulunamadı' });
  }

  const token = request.server.jwt.sign(
    { id: user.id, email: user.email },
    { expiresIn: '1h' }
  );

  pending2FA.delete(email);

  reply.send({ token });
};
