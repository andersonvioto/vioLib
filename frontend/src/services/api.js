import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api'
});

/**
 * Interceptador de Requisição:
 * Injeta automaticamente o token de autorização, se existir, em todas as chamadas à API.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Interceptador de Resposta:
 * Monitora retornos da API. Se receber 401 (Não Autorizado) em rotas protegidas, 
 * limpa os dados locais e força logout. Ignora erros 401 na rota de login para 
 * permitir a exibição de mensagens de erro de "Senha incorreta" no frontend.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      
      // Verifica se a requisição que gerou o erro 401 foi a tentativa de login
      const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');

      // Se não for a rota de login, significa que o token expirou durante o uso do app
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;