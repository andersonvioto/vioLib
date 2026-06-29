import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logoImg from '../assets/violib-logo-full2.png';
import './Auth.css'; // Atualizado para apontar para o CSS Mestre de Autenticação

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verificando o seu e-mail, por favor aguarde...');
  
  // TRAVA DE SEGURANÇA: Evita que o React StrictMode dispare 2 vezes em desenvolvimento
  const hasFetched = useRef(false);

  useEffect(() => {
    // Se já buscou, aborta a execução
    if (hasFetched.current) return;

    const verifyToken = async () => {
      hasFetched.current = true; // Marca como já disparado
      
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
    <div className="auth-container">
      <div className="auth-card security-card-centered">
        <img src={logoImg} alt="vioLib" className="auth-logo-img security-logo" />
        
        <h2 className="security-title">Verificação de Conta</h2>

        {/* Adicionado o spinner visual para melhorar a UX durante a espera */}
        {status === 'loading' && (
          <div className="status-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <span className="auth-spinner"></span>
            <p>{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="status-success-block">
            <span className="material-symbols-rounded status-icon">check_circle</span>
            <p>{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="status-error-block">
            <span className="material-symbols-rounded status-icon">error</span>
            <p>{message}</p>
          </div>
        )}

        {(status === 'success' || status === 'error') && (
          <button onClick={() => navigate('/login')} className="btn-auth-submit btn-security-action">
            Ir para o Login
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;