import { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';

/**
 * Componente de configurações de segurança e exclusão de conta.
 */
const SecuritySettings = () => {
  const { logout } = useContext(AuthContext);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleDeleteClick = () => {
    setShowConfirm(true);
    setMessage({ type: '', text: '' });
  };

  const handleCancelClick = () => {
    setShowConfirm(false);
    setPassword('');
    setMessage({ type: '', text: '' });
  };

  const handleConfirmDelete = async () => {
    if (!password) {
      return setMessage({ type: 'error', text: 'Por favor, informe sua senha.' });
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // O Axios suporta enviar um 'data' payload em métodos DELETE
      await api.delete('/users/profile', { data: { password } });
      
      setMessage({ type: 'success', text: 'Conta excluída com sucesso. Redirecionando...' });
      
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Ocorreu um erro ao excluir a conta.' 
      });
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Segurança da Conta</h2>
      <p className="settings-hint">
        Gerencie opções críticas e ações destrutivas da sua conta vioLib.
      </p>

      {message.text && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: message.type === 'error' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(77, 255, 136, 0.1)',
          color: message.type === 'error' ? '#ff4d4d' : '#4dff88',
          border: `1px solid ${message.type === 'error' ? '#ff4d4d' : '#4dff88'}`
        }}>
          {message.text}
        </div>
      )}

      <div className="danger-zone">
        <h3>Excluir Conta Permanentemente</h3>
        <p>
          Esta ação é <strong>irreversível</strong>. Todos os seus dados pessoais, livros cadastrados, gêneros customizados e histórico de empréstimos serão permanentemente apagados dos nossos servidores.
        </p>

        {!showConfirm ? (
          <button type="button" className="btn-danger" onClick={handleDeleteClick}>
            Desejo excluir minha conta
          </button>
        ) : (
          <div className="danger-confirm-box">
            <p style={{ color: '#ff4d4d', fontWeight: 'bold' }}>
              Para confirmar a exclusão, digite sua senha atual:
            </p>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              style={{ marginBottom: '15px', maxWidth: '300px' }}
              disabled={isLoading}
            />
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                type="button" 
                className="btn-danger" 
                onClick={handleConfirmDelete}
                disabled={isLoading}
              >
                {isLoading ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
              <button 
                type="button" 
                className="btn-back" 
                style={{ margin: 0 }} 
                onClick={handleCancelClick}
                disabled={isLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;