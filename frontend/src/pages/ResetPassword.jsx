import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logoImg from '../assets/violib-logo-full2.png';
import './Auth.css';

/**
 * Tela de recuperação e redefinição de senha via token.
 * Apresenta validações visuais sem layout shift e alvos ergonômicos no mobile.
 */
const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setMessage({ type: '', text: '' });
    setIsLoading(true);

    if (password !== confirmPassword) {
      setIsLoading(false);
      return setMessage({ type: 'error', text: 'As senhas digitadas não coincidem.' });
    }
    if (password.length < 6) {
      setIsLoading(false);
      return setMessage({
        type: 'error',
        text: 'A senha deve ter pelo menos 6 caracteres por segurança.'
      });
    }

    try {
      const response = await api.post('/auth/reset-password', { token, newPassword: password });
      setMessage({ type: 'success', text: response.data.message });

      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Link de recuperação inválido ou expirado.'
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <section className="auth-card" aria-labelledby="reset-title">
        <img
          src={logoImg}
          alt="vioLib - Identidade Visual"
          className="auth-logo-img security-logo"
        />

        <h1 id="reset-title" className="security-title">
          Criar Nova Senha
        </h1>

        {message.text && (
          <div
            className={`auth-alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="input-group">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
              disabled={isLoading || message.type === 'success'}
              aria-label="Digite sua nova senha"
            />
            <span className="material-symbols-rounded input-icon" aria-hidden="true">
              lock
            </span>
          </div>

          <div className="input-group">
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirme a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="auth-input"
              disabled={isLoading || message.type === 'success'}
              aria-label="Confirme sua nova senha"
            />
            <span className="material-symbols-rounded input-icon" aria-hidden="true">
              lock_reset
            </span>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="btn-toggle-password"
              disabled={isLoading || message.type === 'success'}
              tabIndex="-1"
              aria-label={showPassword ? 'Ocultar senha digitada' : 'Mostrar senha digitada'}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          <button
            type="submit"
            className="btn-auth-submit btn-security-action"
            disabled={isLoading || message.type === 'success' || !password || !confirmPassword}
          >
            {isLoading ? <span className="auth-spinner" aria-hidden="true"></span> : 'Salvar Senha'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default ResetPassword;
