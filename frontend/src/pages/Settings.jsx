import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Perfil agora com currentPassword
  const [profileData, setProfileData] = useState({ name: '', currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);

  const [authors, setAuthors] = useState([]);
  const [translators, setTranslators] = useState([]);
  const [genres, setGenres] = useState([]);
  const [subgenres, setSubgenres] = useState([]);
  const [sharedWith, setSharedWith] = useState([]);

  useEffect(() => { fetchAttributes(); }, []);

  const fetchAttributes = async () => {
    try {
      const [userRes, authorsRes, transRes, genresRes, subRes, sharesRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/attributes/authors'),
        api.get('/attributes/translators'),
        api.get('/attributes/genres'),
        api.get('/attributes/subgenres'),
        api.get('/access/my-shares')
      ]);
      setProfileData(prev => ({ ...prev, name: userRes.data.name }));
      setAuthors(authorsRes.data);
      setTranslators(transRes.data);
      setGenres(genresRes.data);
      setSubgenres(subRes.data);
      setSharedWith(sharesRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados.", error);
    }
  };

  // --- HANDLERS DO PERFIL ---
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

  // --- HANDLERS DE ATRIBUTOS (INCLUIR, EDITAR, DESATIVAR) ---
  const handleAddAttribute = async (type, genreId = null) => {
    const name = window.prompt("Digite o nome do novo registro:");
    if (!name || name.trim() === '') return;

    try {
      const payload = { name };
      if (genreId) payload.GenreId = genreId; // Necessário para subgêneros

      await api.post(`/attributes/${type}`, payload);
      fetchAttributes();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao adicionar registro.");
    }
  };

  const handleEditAttribute = async (type, id, currentName) => {
    const newName = window.prompt("Alterar nome para:", currentName);
    if (!newName || newName.trim() === '' || newName === currentName) return;

    try {
      await api.put(`/attributes/${type}/${id}`, { name: newName });
      fetchAttributes();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao editar registro.");
    }
  };

  const handleDisableAttribute = async (type, id) => {
    if (!window.confirm(`Tem certeza que deseja desativar este item?`)) return;
    try {
      await api.delete(`/attributes/${type}/${id}`);
      fetchAttributes(); 
    } catch (error) {
      alert("Erro ao desativar.");
    }
  };

  const handleRevokeAccess = async (guestId, guestName) => {
    if (!window.confirm(`Deseja revogar o acesso de ${guestName}?`)) return;
    try {
      await api.delete(`/access/revoke/${guestId}`);
      fetchAttributes();
    } catch (error) {
      alert("Erro ao revogar acesso.");
    }
  };

  return (
    <div className="settings-container">
      
      {/* BOTÃO VOLTAR E CABEÇALHO */}
      <button onClick={() => navigate('/biblioteca')} className="btn-back">
        <span className="material-symbols-rounded">arrow_back</span> Voltar para a Biblioteca
      </button>

      <h1 className="settings-header">Configurações da Conta</h1>
      
      <div className="settings-layout">
        <aside className="settings-sidebar">
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Meu Perfil</button>
          <button className={activeTab === 'shares' ? 'active' : ''} onClick={() => setActiveTab('shares')}>Compartilhamento</button>
          <button className={activeTab === 'authors' ? 'active' : ''} onClick={() => setActiveTab('authors')}>Meus Autores</button>
          <button className={activeTab === 'translators' ? 'active' : ''} onClick={() => setActiveTab('translators')}>Meus Tradutores</button>
          <button className={activeTab === 'genres' ? 'active' : ''} onClick={() => setActiveTab('genres')}>Gêneros e Subgêneros</button>
        </aside>

        <main className="settings-content">
          
          {/* PERFIL */}
          {activeTab === 'profile' && (
            <div className="settings-panel">
              <h2>Editar Perfil</h2>
              
              {profileMsg.text && (
                <div className={`auth-alert ${profileMsg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="settings-form">
                
                {/* 1. NOME DE USUÁRIO */}
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
                
                <h3 style={{ marginTop: '20px', marginBottom: '10px', color: '#D4AF37', fontSize: '1.1rem' }}>
                  Segurança
                </h3>
                
                {/* 2. SENHA ATUAL */}
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

                {/* 3. NOVA SENHA (Agora com o Olho e Alinhamento) */}
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

                {/* 4. CONFIRMAÇÃO DA NOVA SENHA (Agora com o Olho e Alinhamento) */}
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
                
                <button type="submit" className="btn-auth-submit" style={{ marginTop: '15px' }}>
                  Salvar Alterações
                </button>
              </form>
            </div>
          )}

          {/* COMPARTILHAMENTO */}
          {activeTab === 'shares' && (
            <div className="settings-panel">
              <h2>Pessoas com Acesso</h2>
              <ul className="attribute-list">
                {sharedWith.map(share => (
                  <li key={share.id} className="attribute-item">
                    <div>
                      <strong style={{ display: 'block', fontSize: '1.1rem' }}>{share.Guest?.name}</strong>
                      <span style={{ color: '#888', fontSize: '0.9rem' }}>{share.Guest?.email}</span>
                    </div>
                    <button onClick={() => handleRevokeAccess(share.guestId, share.Guest?.name)} className="btn-disable">
                      <span className="material-symbols-rounded" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '5px' }}>person_remove</span> Revogar
                    </button>
                  </li>
                ))}
                {sharedWith.length === 0 && <li className="empty-msg">Nenhum compartilhamento ativo.</li>}
              </ul>
            </div>
          )}

          {/* AUTORES */}
          {activeTab === 'authors' && (
            <div className="settings-panel">
              <h2>Gerenciar Autores</h2>
              <button onClick={() => handleAddAttribute('authors')} className="btn-add">
                <span className="material-symbols-rounded">add</span> Adicionar Autor
              </button>
              <ul className="attribute-list">
                {authors.map(author => (
                  <li key={author.id} className="attribute-item">
                    <span>{author.name}</span>
                    <div className="attribute-actions">
                      <button onClick={() => handleEditAttribute('authors', author.id, author.name)} className="btn-edit">Editar</button>
                      <button onClick={() => handleDisableAttribute('authors', author.id)} className="btn-disable-small">Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TRADUTORES */}
          {activeTab === 'translators' && (
            <div className="settings-panel">
              <h2>Gerenciar Tradutores</h2>
              <button onClick={() => handleAddAttribute('translators')} className="btn-add">
                <span className="material-symbols-rounded">add</span> Adicionar Tradutor
              </button>
              <ul className="attribute-list">
                {translators.map(translator => (
                  <li key={translator.id} className="attribute-item">
                    <span>{translator.name}</span>
                    <div className="attribute-actions">
                      <button onClick={() => handleEditAttribute('translators', translator.id, translator.name)} className="btn-edit">Editar</button>
                      <button onClick={() => handleDisableAttribute('translators', translator.id)} className="btn-disable-small">Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* GÊNEROS E SUBGÊNEROS */}
          {activeTab === 'genres' && (
            <div className="settings-panel">
              <h2>Gerenciar Gêneros</h2>
              <button onClick={() => handleAddAttribute('genres')} className="btn-add">
                <span className="material-symbols-rounded">add</span> Novo Gênero Principal
              </button>
              
              <div className="genres-container">
                {genres.map(genre => (
                  <div key={genre.id} className="genre-card">
                    <div className="genre-header">
                      <h3>{genre.name}</h3>
                      <div className="attribute-actions">
                        <button onClick={() => handleEditAttribute('genres', genre.id, genre.name)} className="btn-edit">Editar</button>
                        <button onClick={() => handleDisableAttribute('genres', genre.id)} className="btn-disable-small">Excluir</button>
                      </div>
                    </div>
                    
                    <ul className="subgenre-list">
                      {subgenres.filter(sub => sub.GenreId === genre.id).map(subgenre => (
                        <li key={subgenre.id} className="attribute-item sub-item">
                          <span>{subgenre.name}</span>
                          <div className="attribute-actions">
                            <button onClick={() => handleEditAttribute('subgenres', subgenre.id, subgenre.name)} className="btn-edit">Editar</button>
                            <button onClick={() => handleDisableAttribute('subgenres', subgenre.id)} className="btn-disable-small">Excluir</button>
                          </div>
                        </li>
                      ))}
                      <li>
                        <button onClick={() => handleAddAttribute('subgenres', genre.id)} className="btn-add" style={{ marginTop: '10px', fontSize: '0.8rem', padding: '5px 10px' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>add</span> Subgênero
                        </button>
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Settings;