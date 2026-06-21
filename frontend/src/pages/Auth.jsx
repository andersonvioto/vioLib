import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './auth.css';
import './security.css';
import logoImg from '../assets/violib-logo-full.png';

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rememberMe, setRememberMe] = useState(false);

  // Estado para controlar o carregamento e bloqueio da tela
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
    setRememberMe(false); // <-- Limpa o checkbox ao trocar de aba
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; // Prevenção extra contra duplo clique

    setMessage({ type: '', text: '' });
    setIsLoading(true); // Bloqueia a tela e exibe o spinner

    try {
      // REGISTRO
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
          setIsLoading(false); // Libera a tela após o delay
          switchView('login');
        }, 4000);
      } 
      
      // LOGIN
      else if (view === 'login') {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          rememberMe: rememberMe
        });
        
        localStorage.setItem('token', response.data.token);
        // Não precisamos setar isLoading(false) aqui porque a página será redirecionada
        navigate('/biblioteca');
      } 
      
      // ESQUECI A SENHA
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
      setIsLoading(false); // Libera a tela para o usuário tentar novamente
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={logoImg} alt="vioLib - Sua biblioteca virtual organizada" className="auth-logo-img" />

        {message.text && (
          <div className={`auth-alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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
              >
                <span className="material-symbols-rounded">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          )}

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
              >
                <span className="material-symbols-rounded">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          )}
          
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
              view === 'login' ? t('login') : view === 'register' ? t('register') : 'Enviar Link de Recuperação'
            )}
          </button>
        </form>

        <div className="auth-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
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