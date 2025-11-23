import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  logout: () => 
    api.post('/auth/logout'),
  
  getCurrentUser: () => 
    api.get('/auth/me')
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: () => 
    api.get('/dashboard/stats'),
  
  getRecentBookings: () => 
    api.get('/dashboard/recent-bookings')
};

// Resources API calls
export const resourceAPI = {
  getAll: () => 
    api.get('/resources'),
  
  getById: (id) => 
    api.get(`/resources/${id}`),
  
  create: (data) => 
    api.post('/resources', data),
  
  update: (id, data) => 
    api.put(`/resources/${id}`, data),
  
  delete: (id) => 
    api.delete(`/resources/${id}`),
  
  getTypes: () => 
    api.get('/resources/types')
};

// Bookings API calls
export const bookingAPI = {
  getAll: () => 
    api.get('/bookings'),
  
  getById: (id) => 
    api.get(`/bookings/${id}`),
  
  create: (data) => 
    api.post('/bookings', data),
  
  update: (id, data) => 
    api.put(`/bookings/${id}`, data),
  
  delete: (id) => 
    api.delete(`/bookings/${id}`),
  
  approve: (id) => 
    api.put(`/bookings/${id}/approve`),
  
  reject: (id) => 
    api.put(`/bookings/${id}/reject`)
};

// Users API calls
export const userAPI = {
  getAll: () => 
    api.get('/users'),
  
  getById: (id) => 
    api.get(`/users/${id}`),
  
  update: (id, data) => 
    api.put(`/users/${id}`, data),
  
  delete: (id) => 
    api.delete(`/users/${id}`)
};

export default api;