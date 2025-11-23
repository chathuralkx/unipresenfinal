// backend/utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendOTPEmail = async (toEmail, otp) => {
  const subject = 'Password reset OTP';
  const html = `
    <p>You requested a password reset. Use this OTP to reset your password:</p>
    <h2>${otp}</h2>
    <p>This code expires in ${process.env.OTP_TTL_MINUTES || 15} minutes.</p>
    <p>If you didn't request this, please ignore.</p>
  `;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject,
    html
  });

  return info;
};

module.exports = { sendOTPEmail };
