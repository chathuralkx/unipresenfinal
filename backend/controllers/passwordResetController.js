// backend/controllers/passwordResetController.js
const crypto = require('crypto');
const db = require('../config/database'); // your pool
const { sendOTPEmail } = require('../utils/email');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);
const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || '15', 10);

function generateNumericOTP(length) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

// 1) Request OTP
exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Ensure the user exists
    const [users] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      // For security, respond with success even if email doesn't exist
      return res.json({ message: 'If the email exists, an OTP has been sent' });
    }

    const otp = generateNumericOTP(OTP_LENGTH);
    const expiresAt = dayjs().add(OTP_TTL_MINUTES, 'minute').format('YYYY-MM-DD HH:mm:ss');

    // Insert into password_resets (mark old not used)
    await db.query('INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt]);

    // Send email (async)
    await sendOTPEmail(email, otp);

    return res.json({ message: 'If the email exists, an OTP has been sent' });
  } catch (err) {
    console.error('requestOtp error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 2) Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (rows.length === 0) return res.status(400).json({ message: 'Invalid OTP' });

    const record = rows[0];
    const now = dayjs();
    if (now.isAfter(dayjs(record.expires_at))) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Mark OTP used to prevent reuse (optional: only on reset, but here we'll mark used)
    await db.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [record.id]);

    // Optionally, return a short-lived token to allow password reset:
    // But to keep it simple, return success and frontend will call reset with same email+otp
    return res.json({ message: 'OTP verified' });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 3) Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password required' });
    }

    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (rows.length === 0) return res.status(400).json({ message: 'Invalid OTP or already used' });

    const record = rows[0];
    const now = dayjs();
    if (now.isAfter(dayjs(record.expires_at))) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update users table
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // mark OTP as used
    await db.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [record.id]);

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
