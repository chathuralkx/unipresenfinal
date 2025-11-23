import React, { useState } from 'react';
import { requestOtp } from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await requestOtp(email);
      setMsg('If the email exists an OTP was sent.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error sending OTP');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send OTP</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
};

export default ForgotPassword;
