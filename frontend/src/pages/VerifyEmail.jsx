import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logoImg from '../assets/violib-logo-full2.png';
import './Auth.css';

/**
 * Tela de confirmação e validação de e-mail via token de segurança.
 * Apresenta feedback de status acessível para leitores de tela sem saltos de layout.
 */
const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState(
    'Verificando o seu e-mail, por favor aguarde um momento...'
  );

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;

    const verifyToken = async () => {
      hasFetched.current = true;

      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Link de verificação inválido ou expirado.');
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  return (
    <main className="auth-container">
      <section className="auth-card security-card-centered" aria-labelledby="verify-title">
        <img
          src={logoImg}
          alt="vioLib - Identidade Visual"
          className="auth-logo-img security-logo"
        />

        <h1 id="verify-title" className="security-title">
          Verificação de Conta
        </h1>

        <div role="status" aria-live="polite" className="verification-status-wrapper">
          {status === 'loading' && (
            <div className="status-loading">
              <span className="auth-spinner" aria-hidden="true"></span>
              <p className="status-message-text">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="status-success-block">
              <span className="material-symbols-rounded status-icon" aria-hidden="true">
                check_circle
              </span>
              <p className="status-message-text">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="status-error-block">
              <span className="material-symbols-rounded status-icon" aria-hidden="true">
                error
              </span>
              <p className="status-message-text">{message}</p>
            </div>
          )}
        </div>

        {(status === 'success' || status === 'error') && (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-auth-submit btn-security-action"
          >
            <span>Ir para o Login</span>
          </button>
        )}
      </section>
    </main>
  );
};

export default VerifyEmail;
