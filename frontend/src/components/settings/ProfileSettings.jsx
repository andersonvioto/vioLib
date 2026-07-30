import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import './ProfileSettings.css';

/**
 * Componente de configurações do perfil com suporte a Upload de Avatar e Toggles de Privacidade.
 * Funciona através de FormData para suportar multipart/form-data.
 */
const ProfileSettings = () => {
  const { logout } = useContext(AuthContext);
  const isOnline = useNetworkStatus();

  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    shareCollections: true,
    shareReadingStatus: true,
    shareNotes: true
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      await Promise.resolve(); // Barreira de segurança
      try {
        const res = await api.get('/users/profile');
        const data = res.data;
        setProfileData((prev) => ({
          ...prev,
          name: data.name || '',
          username: data.username || '',
          shareCollections: data.shareCollections ?? true,
          shareReadingStatus: data.shareReadingStatus ?? true,
          shareNotes: data.shareNotes ?? true
        }));

        if (data.avatarUrl) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
          setAvatarPreview(`${apiUrl.replace('/api', '/files')}/${data.avatarUrl}`);
        }
      } catch (error) {
        console.error('Erro ao buscar perfil.', error);
      }
    };

    const init = async () => {
      await fetchProfile();
    };
    init();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleToggleChange = (field) => {
    setProfileData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!isOnline) return;

    setProfileMsg({ type: '', text: '' });
    setIsSaving(true);

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmNewPassword) {
      setIsSaving(false);
      return setProfileMsg({ type: 'error', text: 'A confirmação não bate com a nova senha.' });
    }

    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('username', profileData.username.toLowerCase().trim());
      formData.append('shareCollections', profileData.shareCollections);
      formData.append('shareReadingStatus', profileData.shareReadingStatus);
      formData.append('shareNotes', profileData.shareNotes);

      if (profileData.newPassword) {
        formData.append('currentPassword', profileData.currentPassword);
        formData.append('newPassword', profileData.newPassword);
      }

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProfileMsg({ type: 'success', text: response.data.message });
      setProfileData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));
    } catch (error) {
      setProfileMsg({ type: 'error', text: error.response?.data?.error || 'Erro ao atualizar.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    if (!isOnline) return;
    setShowConfirmDelete(true);
    setDeleteMsg({ type: '', text: '' });
  };
  const handleCancelDeleteClick = () => {
    setShowConfirmDelete(false);
    setDeletePassword('');
    setDeleteMsg({ type: '', text: '' });
  };
  const handleConfirmDelete = async () => {
    if (!isOnline) return;
    if (!deletePassword)
      return setDeleteMsg({ type: 'error', text: 'Por favor, informe sua senha.' });
    setIsDeleting(true);
    setDeleteMsg({ type: '', text: '' });
    try {
      await api.delete('/users/profile', { data: { password: deletePassword } });
      setDeleteMsg({ type: 'success', text: 'Conta excluída. Redirecionando...' });
      setTimeout(() => logout(), 2000);
    } catch (error) {
      setDeleteMsg({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao excluir a conta.'
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="settings-panel">
      <h2>Perfil Pessoal</h2>

      {!isOnline && (
        <div className="offline-alert-box">
          <span className="material-symbols-rounded">security</span>
          <span>
            ⚠️ <strong>Modo Offline:</strong> A alteração de dados do perfil foi desativada
            temporariamente.
          </span>
        </div>
      )}

      {profileMsg.text && (
        <div className={`profile-alert-msg ${profileMsg.type === 'error' ? 'error' : 'success'}`}>
          {profileMsg.text}
        </div>
      )}

      <form onSubmit={handleProfileUpdate} className="settings-form">
        <div className="avatar-upload-area">
          <div className="avatar-preview-circle">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview do Avatar" />
            ) : (
              <span className="material-symbols-rounded">person</span>
            )}
          </div>
          <div className="avatar-upload-actions">
            <strong>Foto de Perfil</strong>
            <label className="btn-action btn-upload" disabled={!isOnline}>
              Escolher Imagem
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={!isOnline}
                hidden
              />
            </label>
            <span className="avatar-hint">Formatos: JPG, PNG (Max 2MB)</span>
          </div>
        </div>

        <div className="input-group">
          <label>Nome Completo</label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            className="auth-input"
            required
            disabled={!isOnline}
          />
        </div>

        <div className="input-group">
          <label>Nome de Usuário (@username)</label>
          <input
            type="text"
            value={profileData.username}
            onChange={(e) =>
              setProfileData({
                ...profileData,
                username: e.target.value.toLowerCase().replace(/\s/g, '')
              })
            }
            className="auth-input"
            placeholder="ex: machadodeassis"
            required
            disabled={!isOnline}
          />
        </div>

        <h3 className="settings-section-title">Privacidade da Comunidade</h3>
        <p className="settings-hint">
          Defina o que os seus amigos podem ver quando visitarem o seu perfil.
        </p>

        <div className="privacy-toggles-container">
          <label className="privacy-toggle">
            <input
              type="checkbox"
              checked={profileData.shareCollections}
              onChange={() => handleToggleChange('shareCollections')}
              disabled={!isOnline}
            />
            <div className="privacy-toggle-text">
              <strong>Mostrar minhas Coleções</strong>
              <span>Permite que vejam os seus álbuns e progresso.</span>
            </div>
          </label>

          <label className="privacy-toggle">
            <input
              type="checkbox"
              checked={profileData.shareReadingStatus}
              onChange={() => handleToggleChange('shareReadingStatus')}
              disabled={!isOnline}
            />
            <div className="privacy-toggle-text">
              <strong>Mostrar Status de Leitura</strong>
              <span>Mostra se o livro está "Lido" ou "Lendo".</span>
            </div>
          </label>

          <label className="privacy-toggle">
            <input
              type="checkbox"
              checked={profileData.shareNotes}
              onChange={() => handleToggleChange('shareNotes')}
              disabled={!isOnline}
            />
            <div className="privacy-toggle-text">
              <strong>Mostrar Notas Pessoais</strong>
              <span>As suas resenhas e anotações nos livros ficam públicas para os amigos.</span>
            </div>
          </label>
        </div>

        <h3 className="settings-section-title">Segurança</h3>

        <div className="input-group">
          <label>Senha Atual (apenas p/ trocar de senha)</label>
          <div className="settings-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              value={profileData.currentPassword}
              onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
              placeholder={!isOnline ? 'Indisponível offline' : 'Digite a senha atual'}
              disabled={!isOnline}
            />
            <span
              className="material-symbols-rounded"
              onClick={() => setShowPassword(!showPassword)}
              style={{ opacity: !isOnline ? 0.5 : 1 }}
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
              placeholder={!isOnline ? 'Indisponível offline' : 'Sua nova senha'}
              disabled={!isOnline}
            />
            <span
              className="material-symbols-rounded"
              onClick={() => setShowPassword(!showPassword)}
              style={{ opacity: !isOnline ? 0.5 : 1 }}
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
                disabled={!isOnline}
              />
            </div>
          </div>
        )}

        <button type="submit" className="btn-action btn-primary" disabled={!isOnline || isSaving}>
          {isSaving ? 'A guardar...' : 'Salvar Alterações'}
        </button>
      </form>

      <hr className="settings-divider" />

      <div className="danger-zone" style={{ width: '100%' }}>
        <h3
          style={{
            color: !isOnline ? 'var(--text-muted)' : '#ff4d4d',
            marginBottom: '10px',
            fontSize: '1.2rem'
          }}
        >
          Excluir Conta Permanentemente
        </h3>
        <p className="settings-hint" style={{ marginBottom: '15px' }}>
          Esta ação é <strong>irreversível</strong>. Todos os seus dados pessoais, livros
          cadastrados, gêneros customizados e histórico de empréstimos serão permanentemente
          apagados dos nossos servidores.
        </p>

        {deleteMsg.text && (
          <div className={`profile-alert-msg ${deleteMsg.type === 'error' ? 'error' : 'success'}`}>
            {deleteMsg.text}
          </div>
        )}

        {!showConfirmDelete ? (
          <button
            type="button"
            className="btn-action"
            style={{
              color: !isOnline ? 'var(--text-muted)' : '#ff4d4d',
              borderColor: !isOnline ? 'var(--text-muted)' : '#ff4d4d'
            }}
            onClick={handleDeleteClick}
            disabled={!isOnline}
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
              border: '1px solid #ff4d4d',
              width: '100%'
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
                width: '100%',
                maxWidth: '300px',
                display: 'block',
                padding: '10px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)'
              }}
              disabled={isDeleting || !isOnline}
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
                disabled={isDeleting || !isOnline}
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
