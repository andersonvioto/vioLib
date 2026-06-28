import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext'; 

import './Auth.css'; 
import logoImg from '../assets/violib-logo-full.png';

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { login } = useContext(AuthContext); 
  
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    if (message.type === 'error') {
      setMessage({ type: '', text: '' });
    }
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

  const handleGoogleSuccess = async (credentialResponse) => {
    if (isLoading) return;
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await api.post('/auth/google', { token: credentialResponse.credential });
      // Login via Google já assume "manter conectado" para melhorar a UX
      login(response.data.token, response.data.user, true); 
      navigate('/biblioteca');
    } catch (error) {
      setMessage({ type: 'error', text: 'Não foi possível fazer login com o Google.' });
      setIsLoading(false);
    }
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
        
        setView('login');
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setShowPassword(false);
        setShowConfirmPassword(false);
        setIsLoading(false);
        setMessage({ type: 'success', text: response.data.message });
      } 
      else if (view === 'login') {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          rememberMe: rememberMe
        });
        
        login(response.data.token, response.data.user, rememberMe);
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

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
                  tabIndex="-1"
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
                  tabIndex="-1"
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
                view === 'login' ? t('login') : view === 'register' ? t('register') : 'Enviar Link'
              )}
            </button>
            
            {/* INJEÇÃO DO BOTÃO DO GOOGLE (Disponível no Login e Registro) */}
            {(view === 'login' || view === 'register') && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', opacity: 0.6 }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                  <span style={{ padding: '0 10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ou</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setMessage({ type: 'error', text: 'Ocorreu um erro ao comunicar com o Google.' })}
                    theme="filled_black" // Opções: outline, filled_blue, filled_black
                    text={view === 'login' ? "signin_with" : "signup_with"}
                    shape="pill"
                    width="100%"
                  />
                </div>
              </>
            )}

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
    </GoogleOAuthProvider>
  );
};

export default Auth;