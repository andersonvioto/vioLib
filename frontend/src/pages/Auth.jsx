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
  
  // Controle de qual tela exibir: 'login', 'register' ou 'forgot'
  const [view, setView] = useState('login');
  
  // Estado unificado do formulário
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  
  // Controle de visibilidade de senha
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sistema de feedback visual (Substitui o alert)
  const [message, setMessage] = useState({ type: '', text: '' });

  // Atualiza os dados do formulário conforme o usuário digita
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Função para limpar o formulário e trocar de aba limpo
  const switchView = (newView) => {
    setView(newView);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setMessage({ type: '', text: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Gerenciador central de submissão para as 3 rotas
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' }); // Limpa erros anteriores

    try {
      // REGISTRO
      if (view === 'register') {
        if (formData.password !== formData.confirmPassword) {
          return setMessage({ type: 'error', text: 'As senhas não coincidem. Tente novamente.' });
        }
        if (formData.password.length < 6) {
          return setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        const response = await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        
        setMessage({ type: 'success', text: response.data.message });
        setTimeout(() => switchView('login'), 4000); // Envia para o login após 4s
      } 
      
      // LOGIN
      else if (view === 'login') {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        
        localStorage.setItem('token', response.data.token);
        navigate('/biblioteca');
      } 
      
      // ESQUECI A SENHA
      else if (view === 'forgot') {
        const response = await api.post('/auth/forgot-password', { email: formData.email });
        setMessage({ type: 'success', text: response.data.message });
      }

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Ocorreu um erro inesperado. Tente novamente.' 
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={logoImg} alt="vioLib - Sua biblioteca virtual organizada" className="auth-logo-img" />

        {/* FEEDBACK VISUAL DE SUCESSO OU ERRO */}
        {message.text && (
          <div className={`auth-alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* CAMPO NOME (Apenas Cadastro) */}
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
              />
              <span className="material-symbols-rounded input-icon">person</span>
            </div>
          )}

          {/* CAMPO E-MAIL (Usado nas 3 telas) */}
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

          {/* CAMPO SENHA PRINCIPAL (Login e Cadastro) */}
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
          )}

          {/* CAMPO CONFIRMAR SENHA (Apenas Cadastro) */}
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
              />
              <span className="material-symbols-rounded input-icon">lock_reset</span>
              
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="btn-toggle-password"
                title={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                <span className="material-symbols-rounded">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          )}
          
          <button type="submit" className="btn-auth-submit">
            {view === 'login' ? t('login') : view === 'register' ? t('register') : 'Enviar Link de Recuperação'}
          </button>
        </form>

        {/* CONTROLES DE RODAPÉ (Navegação entre telas) */}
        <div className="auth-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
          
          {view === 'login' && (
            <>
              <span className="auth-link" onClick={() => switchView('forgot')} style={{ fontSize: '0.9em', color: '#D4AF37', cursor: 'pointer' }}>
                Esqueceu sua senha?
              </span>
              <div>
                Não tem uma conta? <span className="auth-link" onClick={() => switchView('register')} style={{ cursor: 'pointer', fontWeight: 'bold' }}>Criar conta gratuita</span>
              </div>
            </>
          )}

          {(view === 'register' || view === 'forgot') && (
            <div>
              Lembrou da senha? <span className="auth-link" onClick={() => switchView('login')} style={{ cursor: 'pointer', fontWeight: 'bold' }}>Entrar no sistema</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Auth;