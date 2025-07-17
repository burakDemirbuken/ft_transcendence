const express = require('express');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = 3000;

app.use(express.json()); // Body parse middleware

// 🔍 Tüm gelen istekleri logla
app.use((req, res, next) => {
  console.log(`📥 Gelen istek: ${req.method} ${req.url}`);
  next();
});

app.use("/api/users", userRoutes);

app.listen(port, () => {
  console.log(`🚀 API çalışıyor → http://localhost:${port}`);
});
