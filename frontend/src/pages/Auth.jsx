import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
// Opcional: Descomente a linha abaixo caso queira integrar o contexto global no futuro
// import { AuthContext } from '../contexts/AuthContext'; 

import './Auth.css'; // Importação única do CSS modularizado
import logoImg from '../assets/violib-logo-full.png';

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // const { login } = useContext(AuthContext); // Exemplo de uso para arquitetura futura
  
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const switchView = (newView) => {
    if (isLoading) return;
    setView(newView);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setMessage({ type: '', text: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRememberMe(false);
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setMessage({ type: '', text: '' });
    setIsLoading(true);

    try {
      if (view === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setIsLoading(false);
          return setMessage({ type: 'error', text: 'As senhas não coincidem. Tente novamente.' });
        }
        if (formData.password.length < 6) {
          setIsLoading(false);
          return setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        const response = await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        
        setMessage({ type: 'success', text: response.data.message });
        setTimeout(() => {
          setIsLoading(false);
          switchView('login');
        }, 4000);
      } 
      else if (view === 'login') {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          rememberMe: rememberMe
        });
        
        // Padrão atual: Gestão manual do LocalStorage
        localStorage.setItem('token', response.data.token);
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        // Padrão Ideal Futuro:
        // login(response.data.token, rememberMe);

        navigate('/biblioteca');
      } 
      else if (view === 'forgot') {
        const response = await api.post('/auth/forgot-password', { email: formData.email });
        setMessage({ type: 'success', text: response.data.message });
        setIsLoading(false);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Ocorreu um erro inesperado. Tente novamente.' 
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={logoImg} alt="vioLib - Sua biblioteca virtual organizada" className="auth-logo-img" />

        {/* Módulo de Feedback Visual Unificado */}
        {message.text && (
          <div className={`auth-alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          
          {/* Nome - Exclusivo para Registo */}
          {view === 'register' && (
            <div className="input-group">
              <input 
                type="text" 
                name="name" 
                placeholder="Seu Nome" 
                value={formData.name}
                onChange={handleChange} 
                required 
                className="auth-input"
                disabled={isLoading}
              />
              <span className="material-symbols-rounded input-icon">person</span>
            </div>
          )}

          {/* Email - Comum a todas as views */}
          <div className="input-group">
            <input 
              type="email" 
              name="email" 
              placeholder={t('email')} 
              value={formData.email}
              onChange={handleChange} 
              required 
              className="auth-input"
              disabled={isLoading}
            />
            <span className="material-symbols-rounded input-icon">mail</span>
          </div>

          {/* Senha - Login e Registo */}
          {(view === 'login' || view === 'register') && (
            <div className="input-group">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder={t('password')} 
                value={formData.password}
                onChange={handleChange} 
                required 
                className="auth-input"
                disabled={isLoading}
              />
              <span className="material-symbols-rounded input-icon">lock</span>
              
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="btn-toggle-password"
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                disabled={isLoading}
                tabIndex="-1"
              >
                <span className="material-symbols-rounded">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          )}

          {/* Confirmação de Senha - Exclusivo para Registo */}
          {view === 'register' && (
            <div className="input-group">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword" 
                placeholder="Confirme a senha" 
                value={formData.confirmPassword}
                onChange={handleChange} 
                required 
                className="auth-input"
                disabled={isLoading}
              />
              <span className="material-symbols-rounded input-icon">lock_reset</span>
              
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="btn-toggle-password"
                title={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                disabled={isLoading}
                tabIndex="-1"
              >
                <span className="material-symbols-rounded">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          )}
          
          {/* Manter Conectado - Exclusivo para Login */}
          {view === 'login' && (
            <div className="remember-me-container">
              <label className="remember-me-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  disabled={isLoading}
                  className="remember-me-checkbox"
                />
                <span>Me mantenha conectado</span>
              </label>
            </div>
          )}

          <button type="submit" className="btn-auth-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="auth-spinner"></span>
            ) : (
              view === 'login' ? t('login') : view === 'register' ? t('register') : 'Enviar Link'
            )}
          </button>
        </form>

        <div className="auth-footer">
          {view === 'login' && (
            <>
              <span 
                className={`auth-link ${isLoading ? 'disabled-link' : ''}`} 
                onClick={() => switchView('forgot')} 
                style={{ fontSize: '0.9em' }}
              >
                Esqueceu sua senha?
              </span>
              <div>
                Não tem uma conta?{' '}
                <span 
                  className={`auth-link ${isLoading ? 'disabled-link' : ''}`} 
                  onClick={() => switchView('register')} 
                  style={{ fontWeight: 'bold' }}
                >
                  Criar conta gratuita
                </span>
              </div>
            </>
          )}

          {(view === 'register' || view === 'forgot') && (
            <div>
              Lembrou da senha?{' '}
              <span 
                className={`auth-link ${isLoading ? 'disabled-link' : ''}`} 
                onClick={() => switchView('login')} 
                style={{ fontWeight: 'bold' }}
              >
                Entrar no sistema
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;