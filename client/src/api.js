import axios from 'axios';

// In dev, Vite proxies /api to localhost:5000.
// In production, VITE_API_URL is set to the Render backend URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = import.meta.env.BASE_URL + '#/login';
    }
    return Promise.reject(err);
  }
);

export default api;
