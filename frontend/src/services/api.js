import axios from 'axios';

// Configura a URL base do nosso back-end
const api = axios.create({
  //baseURL: 'http://localhost:3000/api', 
  baseURL: 'http://127.0.0.1:3000/api',
});

// Interceptador: injeta o token de segurança em TODAS as requisições automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;