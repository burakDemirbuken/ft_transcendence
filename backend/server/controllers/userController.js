const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const SECRET_KEY = 'gizli_anahtar'; // sonra .env'e taşınır

userModel.createUserTable();

const register = async (req, res) => {
  const { username, email, password } = req.body;
  console.log('Gelen veri:', req.body);
  // Giriş verisi kontrolü
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email ve password gerekli.' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    userModel.createUser(username, email, hashed, (err, id) => {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Bu kullanıcı adı veya e-posta zaten kayıtlı.' });
      }
      return res.status(500).json({ error: err.message });
    }

      res.status(201).json({ id, username, email });
    });
  } catch (error) {
    res.status(500).json({ error: 'Kayıt sırasında beklenmedik bir hata oluştu.' });
  }
};


const login = (req, res) => {
  const { username, password } = req.body;

  userModel.getUserByUsername(username, async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Şifre yanlış.' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  });
};

const getUsers = (req, res) => {
  userModel.getAllUsers((err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users);
  });
};

module.exports = {
  register,
  login,
  getUsers
};
