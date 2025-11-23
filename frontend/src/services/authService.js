// frontend/src/services/authService.js
import api from './api';

export const requestOtp = (email) => api.post('/password-reset/request-otp', { email });
export const verifyOtp = (email, otp) => api.post('/password-reset/verify-otp', { email, otp });
export const resetPassword = (email, otp, newPassword) => api.post('/password-reset/reset-password', { email, otp, newPassword });

// existing auth endpoints
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', data);
