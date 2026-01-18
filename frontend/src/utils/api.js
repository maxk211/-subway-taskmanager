import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://subway-taskmanager-production.up.railway.app/api'
      : 'http://localhost:5000/api'),
});

// Request Interceptor - fügt Token hinzu
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

// Response Interceptor - behandelt Fehler
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

export default api;
