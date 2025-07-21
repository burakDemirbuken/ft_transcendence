const express = require('express');
const userRoutes = require('./routes/userRoutes');
const path = require('path'); // BETUL: For path creation / Path oluşturmak için

const app = express();
const port = 3000;

app.use(express.json()); // Body parse middleware

// 🔍 Tüm gelen istekleri logla
app.use((req, res, next) => {
  console.log(`📥 Gelen istek: ${req.method} ${req.url}`);
  next();
});

// API routes
app.use("/api/users", userRoutes);

// BETUL: Serve index.html for all other routes (for SPA)
// BETUL: Diğer tüm rout'lar için index.html servis et (SPA için)
app.get('*', (req, reply) => {
  reply.sendFile(path.join(__dirname, './frontend', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 API çalışıyor → http://localhost:${port}`);
});
