import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
};

// User endpoints
export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  updateAddress: (data) => api.put('/users/address', data),
  submitKYC: (data) => api.post('/users/kyc/submit', data),
  getKYCStatus: () => api.get('/users/kyc/status'),
  getStats: () => api.get('/users/stats'),
};

// Recipients endpoints
export const recipientAPI = {
  getAll: () => api.get('/recipients'),
  getOne: (id) => api.get(`/recipients/${id}`),
  create: (data) => api.post('/recipients', data),
  update: (id, data) => api.put(`/recipients/${id}`, data),
  delete: (id) => api.delete(`/recipients/${id}`),
};

// Transfer endpoints
export const transferAPI = {
  getQuote: (data) => api.post('/transfers/quote', data),
  create: (data) => api.post('/transfers', data),
  getAll: (params) => api.get('/transfers', { params }),
  getOne: (id) => api.get(`/transfers/${id}`),
  track: (reference) => api.get(`/transfers/track/${reference}`),
  cancel: (id) => api.post(`/transfers/${id}/cancel`),
};

// Exchange rate endpoints
export const exchangeAPI = {
  getRate: (from, to) => api.get('/exchange/rate', { params: { from, to } }),
  getAllRates: (base = 'USD') => api.get('/exchange/rates', { params: { base } }),
  calculate: (data) => api.post('/exchange/calculate', data),
};

// Country endpoints
export const countryAPI = {
  getAll: () => api.get('/countries'),
  getOne: (code) => api.get(`/countries/${code}`),
  getDeliveryMethods: (code) => api.get(`/countries/${code}/delivery-methods`),
};

export default api;
