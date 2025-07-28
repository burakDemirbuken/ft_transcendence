import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER || "forty2transcendence@gmail.com",
        pass: process.env.EMAIL_PASS || "gfyk pfqi gvpm ahtx"
      }
    });

    const mailOptions = {
      from: `"Transcendence" <${process.env.EMAIL_USER || "forty2transcendence@gmail.com"}>`,
      to: to,
      subject: subject,
      text: text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📩 Mail gönderildi: ${info.response}`);
    return info;
  } catch (error) {
    console.error('❌ Mail gönderilemedi:', error.message);
    throw new Error('Mail gönderilemedi');
  }
};
