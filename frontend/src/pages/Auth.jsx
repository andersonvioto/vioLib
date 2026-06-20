import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './auth.css'; // Importa a nova folha de estilo
import logoImg from '../assets/violib-logo-full.png'; // Importa o logo para usar na página

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  
  // Novo estado para controlar a visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);

  // Atualiza os dados do formulário conforme o usuário digita
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Envia os dados para o back-end
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, formData);
      
      // Salva o token de segurança no navegador e redireciona para a biblioteca
      localStorage.setItem('token', response.data.token);
      navigate('/biblioteca');
    } catch (error) {
      alert(error.response?.data?.error || 'Erro na autenticação. Verifique seus dados.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={logoImg} alt="vioLib - Sua biblioteca virtual organizada" className="auth-logo-img" />

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Campo Nome: Renderizado APENAS no Cadastro */}
          {!isLogin && (
            <div className="input-group">
              <input 
                type="text" 
                name="name" 
                placeholder="Seu Nome" 
                value={formData.name}
                onChange={handleChange} 
                required 
                className="auth-input"
              />
              <span className="material-symbols-rounded input-icon">person</span>
            </div>
          )}

          {/* Campo Email */}
          <div className="input-group">
            <input 
              type="email" 
              name="email" 
              placeholder={t('email')} 
              value={formData.email}
              onChange={handleChange} 
              required 
              className="auth-input"
            />
            <span className="material-symbols-rounded input-icon">mail</span>
          </div>

          {/* Campo Senha com Toggle Visual */}
          <div className="input-group">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder={t('password')} 
              value={formData.password}
              onChange={handleChange} 
              required 
              className="auth-input"
            />
            <span className="material-symbols-rounded input-icon">lock</span>
            
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="btn-toggle-password"
              title={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              <span className="material-symbols-rounded">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          
          <button type="submit" className="btn-auth-submit">
            {isLogin ? t('login') : t('register')}
          </button>
        </form>

        {/* Rodapé Dinâmico para Alternar entre Login/Cadastro */}
        <div className="auth-footer">
          {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          <span 
            className="auth-link" 
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({ name: '', email: '', password: '' }); // Limpa o formulário ao trocar
            }}
          >
            {isLogin ? 'Criar conta gratuita' : 'Entrar no sistema'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;