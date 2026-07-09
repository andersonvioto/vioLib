import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { logout } = useContext(AuthContext);

  // --- ESTADOS DE ATUALIZAÇÃO DO PERFIL ---
  const [profileData, setProfileData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);

  // --- ESTADOS DA ZONA DE PERIGO (Exclusão) ---
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        setProfileData((prev) => ({ ...prev, name: res.data.name }));
      } catch (error) {
        console.error('Erro ao buscar perfil.', error);
      }
    };
    fetchProfile();
  }, []);

  // --- LÓGICA DE ATUALIZAÇÃO DE PERFIL E SENHA ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmNewPassword) {
      return setProfileMsg({ type: 'error', text: 'A confirmação não bate com a nova senha.' });
    }

    try {
      const payload = { name: profileData.name };
      if (profileData.newPassword) {
        payload.currentPassword = profileData.currentPassword;
        payload.newPassword = profileData.newPassword;
      }

      const response = await api.put('/users/profile', payload);
      setProfileMsg({ type: 'success', text: response.data.message });
      setProfileData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));
    } catch (error) {
      setProfileMsg({ type: 'error', text: error.response?.data?.error || 'Erro ao atualizar.' });
    }
  };

  // --- LÓGICA DA ZONA DE PERIGO ---
  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
    setDeleteMsg({ type: '', text: '' });
  };

  const handleCancelDeleteClick = () => {
    setShowConfirmDelete(false);
    setDeletePassword('');
    setDeleteMsg({ type: '', text: '' });
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword) {
      return setDeleteMsg({ type: 'error', text: 'Por favor, informe sua senha.' });
    }

    setIsDeleting(true);
    setDeleteMsg({ type: '', text: '' });

    try {
      await api.delete('/users/profile', { data: { password: deletePassword } });

      setDeleteMsg({ type: 'success', text: 'Conta excluída com sucesso. Redirecionando...' });

      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      setDeleteMsg({
        type: 'error',
        text: error.response?.data?.error || 'Ocorreu um erro ao excluir a conta.'
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="settings-panel">
      <h2>Editar Perfil</h2>

      {profileMsg.text && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor:
              profileMsg.type === 'error' ? 'rgba(255,77,77,0.1)' : 'rgba(77,255,77,0.1)',
            color: profileMsg.type === 'error' ? '#ff4d4d' : '#4dff4d',
            border: `1px solid ${profileMsg.type === 'error' ? '#ff4d4d' : '#4dff4d'}`
          }}
        >
          {profileMsg.text}
        </div>
      )}

      <form onSubmit={handleProfileUpdate} className="settings-form">
        <div className="input-group">
          <label>Nome de Usuário</label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            className="auth-input"
            required
          />
        </div>

        <h3
          style={{
            marginTop: '20px',
            marginBottom: '10px',
            color: 'var(--accent-gold)',
            fontSize: '1.1rem'
          }}
        >
          Segurança
        </h3>

        <div className="input-group">
          <label>Senha Atual (obrigatória apenas se for trocar de senha)</label>
          <div className="settings-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              value={profileData.currentPassword}
              onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
              placeholder="Digite a senha atual"
            />
            <span
              className="material-symbols-rounded"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </div>
        </div>

        <div className="input-group">
          <label>Nova Senha</label>
          <div className="settings-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              value={profileData.newPassword}
              onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
              placeholder="Sua nova senha"
            />
            <span
              className="material-symbols-rounded"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </div>
        </div>

        {profileData.newPassword.length > 0 && (
          <div className="input-group">
            <label>Confirme a Nova Senha</label>
            <div className="settings-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={profileData.confirmNewPassword}
                onChange={(e) =>
                  setProfileData({ ...profileData, confirmNewPassword: e.target.value })
                }
                placeholder="Repita a nova senha"
                required
              />
              <span
                className="material-symbols-rounded"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </div>
          </div>
        )}

        <button type="submit" className="btn-action btn-primary" style={{ marginTop: '15px' }}>
          Salvar Alterações
        </button>
      </form>

      {/* ========================================================= */}
      {/* ZONA DE PERIGO (Exclusão da Conta)                        */}
      {/* ========================================================= */}

      <hr
        style={{
          margin: '40px 0 30px 0',
          border: 'none',
          borderTop: '1px solid var(--border-color)'
        }}
      />

      <div className="danger-zone">
        <h3 style={{ color: '#ff4d4d', marginBottom: '10px', fontSize: '1.2rem' }}>
          Excluir Conta Permanentemente
        </h3>
        <p className="settings-hint" style={{ marginBottom: '15px' }}>
          Esta ação é <strong>irreversível</strong>. Todos os seus dados pessoais, livros
          cadastrados, gêneros customizados e histórico de empréstimos serão permanentemente
          apagados dos nossos servidores.
        </p>

        {deleteMsg.text && (
          <div
            style={{
              padding: '12px',
              marginBottom: '20px',
              borderRadius: '4px',
              backgroundColor:
                deleteMsg.type === 'error' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(77, 255, 136, 0.1)',
              color: deleteMsg.type === 'error' ? '#ff4d4d' : '#4dff88',
              border: `1px solid ${deleteMsg.type === 'error' ? '#ff4d4d' : '#4dff88'}`
            }}
          >
            {deleteMsg.text}
          </div>
        )}

        {!showConfirmDelete ? (
          <button
            type="button"
            className="btn-action"
            style={{ color: '#ff4d4d', borderColor: '#ff4d4d' }}
            onClick={handleDeleteClick}
          >
            Desejo excluir minha conta
          </button>
        ) : (
          <div
            className="danger-confirm-box"
            style={{
              background: 'var(--bg-input)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #ff4d4d'
            }}
          >
            <p style={{ color: '#ff4d4d', fontWeight: 'bold', marginBottom: '10px', marginTop: 0 }}>
              Para confirmar a exclusão, digite sua senha atual:
            </p>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="auth-input"
              style={{
                marginBottom: '15px',
                maxWidth: '300px',
                display: 'block',
                padding: '10px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)'
              }}
              disabled={isDeleting}
            />
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-action"
                style={{
                  backgroundColor: '#ff4d4d',
                  color: '#000',
                  border: 'none',
                  fontWeight: 'bold'
                }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
              <button
                type="button"
                className="btn-action"
                style={{ margin: 0, border: 'none', color: 'var(--text-secondary)' }}
                onClick={handleCancelDeleteClick}
                disabled={isDeleting}
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

export default ProfileSettings;
