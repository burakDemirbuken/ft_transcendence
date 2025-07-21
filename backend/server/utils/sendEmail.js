import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "forty2transcendence@gmail.com", // ← boş değil mi kontrol et
      pass: "gfyk pfqi gvpm ahtx", // ← uygulama şifresi olmalı
    },
  });
  await transporter.sendMail({
    from: "forty2transcendence@gmail.com",
    to: to,
    subject: subject,
    text: text,
  });
};
