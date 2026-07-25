import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

import LegalModal from '../components/LegalModal';
import './Auth.css';
import logoImg from '../assets/violib-logo-full2.png';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message.type === 'error') {
      setMessage({ type: '', text: '' });
    }
  };

  const switchView = (newView) => {
    if (isLoading || view === newView) return;
    setView(newView);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setMessage({ type: '', text: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRememberMe(false);
    setTermsAccepted(false);
    setIsLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (isLoading) return;
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/auth/google', { token: credentialResponse.credential });
      login(response.data.token, response.data.user, true);
      navigate('/biblioteca');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Não foi possível fazer login com o Google.' });
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setMessage((prev) => {
      if (prev.text === 'Ocorreu um erro ao comunicar com o Google.') return prev;
      return { type: 'error', text: 'Ocorreu um erro ao comunicar com o Google.' };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setMessage({ type: '', text: '' });
    setIsLoading(true);

    try {
      if (view === 'register') {
        if (!termsAccepted) {
          setIsLoading(false);
          return setMessage({
            type: 'error',
            text: 'Você deve aceitar os Termos de Serviço e a Política de Privacidade para continuar.'
          });
        }

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
          password: formData.password
        });

        setView('login');
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setShowPassword(false);
        setShowConfirmPassword(false);
        setTermsAccepted(false);
        setIsLoading(false);
        setMessage({ type: 'success', text: response.data.message });
      } else if (view === 'login') {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          rememberMe: rememberMe
        });

        login(response.data.token, response.data.user, rememberMe);
        navigate('/biblioteca');
      } else if (view === 'forgot') {
        const response = await api.post('/auth/forgot-password', { email: formData.email });
        setMessage({ type: 'success', text: response.data.message });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erro de autenticação:', error);
      // Aqui é onde a mensagem do 403 ("Por favor, confirme seu e-mail...") é injetada na tela
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Ocorreu um erro inesperado. Tente novamente.'
      });
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="auth-container">
        <div className="auth-card">
          <img
            src={logoImg}
            alt="vioLib - Sua biblioteca virtual organizada"
            className="auth-logo-img"
          />

          {view !== 'forgot' && (
            <div className="auth-tabs" role="tablist" aria-label="Modo de autenticação">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'login'}
                className={`auth-tab ${view === 'login' ? 'active' : ''}`}
                onClick={() => switchView('login')}
              >
                {t('login', 'Login')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'register'}
                className={`auth-tab ${view === 'register' ? 'active' : ''}`}
                onClick={() => switchView('register')}
              >
                {t('register', 'Criar Conta')}
              </button>
            </div>
          )}

          {view === 'forgot' && (
            <div className="auth-view-title">
              <h2>Recuperar Acesso</h2>
              <p>Digite seu e-mail para receber o link de redefinição de senha.</p>
            </div>
          )}

          {message.text && (
            <div
              className={`auth-alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          {/* O FORMULÁRIO TRADICIONAL (Apenas E-mail e Senha) */}
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {view === 'register' && (
              <div className="input-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Seu Nome Completo"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="auth-input"
                  disabled={isLoading}
                  autoComplete="name"
                />
                <span className="material-symbols-rounded input-icon" aria-hidden="true">
                  person
                </span>
              </div>
            )}

            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder={t('email', 'E-mail profissional ou pessoal')}
                value={formData.email}
                onChange={handleChange}
                required
                className="auth-input"
                disabled={isLoading}
                autoComplete="email"
              />
              <span className="material-symbols-rounded input-icon" aria-hidden="true">
                mail
              </span>
            </div>

            {(view === 'login' || view === 'register') && (
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={t('password', 'Sua senha')}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="auth-input"
                  disabled={isLoading}
                  autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                />
                <span className="material-symbols-rounded input-icon" aria-hidden="true">
                  lock
                </span>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-toggle-password"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={isLoading}
                  tabIndex="-1"
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            )}

            {view === 'register' && (
              <div className="input-group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirme a sua senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="auth-input"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <span className="material-symbols-rounded input-icon" aria-hidden="true">
                  lock_reset
                </span>

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="btn-toggle-password"
                  title={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={isLoading}
                  tabIndex="-1"
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
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
                  <span>Manter conectado neste dispositivo</span>
                </label>
              </div>
            )}

            {view === 'register' && (
              <div className="remember-me-container terms-container">
                <label className="remember-me-label terms-label">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    disabled={isLoading}
                    className="remember-me-checkbox terms-checkbox"
                  />
                  <span className="terms-text">
                    Concordo com os{' '}
                    <span
                      className="auth-link"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveModal('terms');
                      }}
                    >
                      Termos de Serviço
                    </span>{' '}
                    e a{' '}
                    <span
                      className="auth-link"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveModal('privacy');
                      }}
                    >
                      Política de Privacidade
                    </span>
                    .
                  </span>
                </label>
              </div>
            )}

            <button type="submit" className="btn-auth-submit" disabled={isLoading}>
              {isLoading ? (
                <span className="auth-spinner" aria-label="Carregando"></span>
              ) : view === 'login' ? (
                t('login', 'Acessar Biblioteca')
              ) : view === 'register' ? (
                t('register', 'Concluir Cadastro')
              ) : (
                'Enviar Link de Redefinição'
              )}
            </button>
          </form>

          {/* O BLOCO DO GOOGLE (Isolado de forma segura fora do form) */}
          {(view === 'login' || view === 'register') && (
            <>
              <div className="auth-divider">
                <div className="divider-line"></div>
                <span className="divider-text">ou continue com</span>
                <div className="divider-line"></div>
              </div>

              <div className="social-login-container">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  text={view === 'login' ? 'signin_with' : 'signup_with'}
                  shape="pill"
                  width="340"
                />

                {view === 'register' && (
                  <span className="social-terms-notice">
                    Ao entrar com o Google, você aceita nossos{' '}
                    <span className="auth-link" onClick={() => setActiveModal('terms')}>
                      Termos
                    </span>{' '}
                    e{' '}
                    <span className="auth-link" onClick={() => setActiveModal('privacy')}>
                      Privacidade
                    </span>
                    .
                  </span>
                )}
              </div>
            </>
          )}

          <div className="auth-footer">
            {view === 'login' && (
              <span
                className={`auth-link ${isLoading ? 'disabled-link' : ''}`}
                onClick={() => switchView('forgot')}
              >
                Esqueceu sua senha?
              </span>
            )}

            {view === 'forgot' && (
              <div>
                Lembrou da senha?{' '}
                <span
                  className={`auth-link auth-link-bold ${isLoading ? 'disabled-link' : ''}`}
                  onClick={() => switchView('login')}
                >
                  Voltar para o Login
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeModal && <LegalModal type={activeModal} onClose={() => setActiveModal(null)} />}
    </GoogleOAuthProvider>
  );
};

export default Auth;
