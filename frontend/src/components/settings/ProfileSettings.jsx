import { useState, useEffect } from 'react';
import api from '../../services/api';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const [profileData, setProfileData] = useState({ name: '', currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        setProfileData(prev => ({ ...prev, name: res.data.name }));
      } catch (error) {
        console.error("Erro ao buscar perfil.", error);
      }
    };
    fetchProfile();
  }, []);

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
      setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' })); 
    } catch (error) {
      setProfileMsg({ type: 'error', text: error.response?.data?.error || 'Erro ao atualizar.' });
    }
  };

  return (
    <div className="settings-panel">
      <h2>Editar Perfil</h2>
      
      {profileMsg.text && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          borderRadius: '4px', 
          backgroundColor: profileMsg.type === 'error' ? 'rgba(255,77,77,0.1)' : 'rgba(77,255,77,0.1)', 
          color: profileMsg.type === 'error' ? '#ff4d4d' : '#4dff4d',
          border: `1px solid ${profileMsg.type === 'error' ? '#ff4d4d' : '#4dff4d'}`
        }}>
          {profileMsg.text}
        </div>
      )}

      <form onSubmit={handleProfileUpdate} className="settings-form">
        <div className="input-group">
          <label>Nome de Usuário</label>
          <input 
            type="text" 
            value={profileData.name} 
            onChange={e => setProfileData({...profileData, name: e.target.value})} 
            className="auth-input" 
            required 
          />
        </div>
        
        <h3 style={{ marginTop: '20px', marginBottom: '10px', color: 'var(--accent-gold)', fontSize: '1.1rem' }}>Segurança</h3>
        
        <div className="input-group">
          <label>Senha Atual (obrigatória apenas se for trocar de senha)</label>
          <div className="settings-input-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              value={profileData.currentPassword} 
              onChange={e => setProfileData({...profileData, currentPassword: e.target.value})} 
              placeholder="Digite a senha atual" 
            />
            <span className="material-symbols-rounded" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </div>
        </div>

        <div className="input-group">
          <label>Nova Senha</label>
          <div className="settings-input-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              value={profileData.newPassword} 
              onChange={e => setProfileData({...profileData, newPassword: e.target.value})} 
              placeholder="Sua nova senha" 
            />
            <span className="material-symbols-rounded" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </div>
        </div>

        {profileData.newPassword.length > 0 && (
          <div className="input-group">
            <label>Confirme a Nova Senha</label>
            <div className="settings-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                value={profileData.confirmNewPassword} 
                onChange={e => setProfileData({...profileData, confirmNewPassword: e.target.value})} 
                placeholder="Repita a nova senha" 
                required 
              />
              <span className="material-symbols-rounded" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </div>
          </div>
        )}
        
        {/* Reutilizando botão primário do sistema */}
        <button type="submit" className="btn-action btn-primary" style={{ marginTop: '15px' }}>
          Salvar Alterações
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;