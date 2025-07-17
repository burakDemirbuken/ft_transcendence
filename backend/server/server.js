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


curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ5dW51cyIsImlhdCI6MTc1Mjc0OTYxMSwiZXhwIjoxNzUyNzUzMjExfQ.om0L12eH17GB8ssLxNN0lyU_LofUxmc73m0cbi7l0i8"
