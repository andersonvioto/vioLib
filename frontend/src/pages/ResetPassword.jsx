import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logoImg from '../assets/violib-logo-full.png';
import './security.css'; 

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (password !== confirmPassword) {
      return setMessage({ type: 'error', text: 'As senhas não coincidem.' });
    }
    if (password.length < 6) {
      return setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
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
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={logoImg} alt="vioLib" className="auth-logo-img security-logo" />
        
        <h2 className="security-title">Criar Nova Senha</h2>

        {message.text && (
          <div className={`auth-alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Nova senha" 
              value={password}
              onChange={e => setPassword(e.target.value)} 
              required 
              className="auth-input"
            />
            <span className="material-symbols-rounded input-icon">lock</span>
          </div>

          <div className="input-group">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Confirme a nova senha" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              className="auth-input"
            />
            <span className="material-symbols-rounded input-icon">lock_reset</span>
            
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="btn-toggle-password"
            >
              <span className="material-symbols-rounded">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>

          <button type="submit" className="btn-auth-submit btn-security-action" disabled={message.type === 'success'}>
            Salvar Senha
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;