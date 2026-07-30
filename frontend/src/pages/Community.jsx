import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import './Community.css';

const getAvatarUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
  return `${apiUrl.replace('/api', '/files')}/${filename}`;
};

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const Avatar = ({ user }) => {
  const src = getAvatarUrl(user?.avatarUrl);
  return src ? (
    <img src={src} alt={user?.name} className="comm-avatar-img" />
  ) : (
    <div className="comm-avatar-initials">{getInitials(user?.name)}</div>
  );
};

const Community = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('network'); // 'network' ou 'discover'

  // Estados de Rede (Amigos e Pedidos)
  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(true);

  // Estados de Descoberta
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchNetwork = useCallback(async () => {
    await Promise.resolve(); // Barreira de segurança
    try {
      const response = await api.get('/friendships');
      setFriends(response.data.friends || []);
      setPendingReceived(response.data.pendingReceived || []);
      setPendingSent(response.data.pendingSent || []);
    } catch (error) {
      console.error('Erro ao buscar rede:', error);
    } finally {
      setIsLoadingNetwork(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchNetwork();
    };
    init();
  }, [fetchNetwork]);

  // Handler de Busca
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 3) {
        setIsSearching(true);
        try {
          const res = await api.get(`/friendships/search?q=${searchQuery}`);
          setSearchResults(res.data);
        } catch (error) {
          console.error('Erro na pesquisa de comunidade:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSendRequest = async (receiverId) => {
    try {
      await api.post('/friendships/request', { receiverId });
      fetchNetwork();
      alert('Pedido enviado!');
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      alert(error.response?.data?.error || 'Erro ao enviar pedido.');
    }
  };

  const handleRespondRequest = async (friendshipId, accept) => {
    try {
      await api.put(`/friendships/request/${friendshipId}`, { accept });
      fetchNetwork();
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      alert('Erro ao processar pedido.');
    }
  };

  const handleRemoveFriend = async (friendId, name) => {
    if (!window.confirm(`Deseja desfazer a conexão com ${name}?`)) return;
    try {
      await api.delete(`/friendships/${friendId}`);
      fetchNetwork();
    } catch (error) {
      console.error('Erro ao remover amigo:', error);
      alert('Erro ao remover amigo.');
    }
  };

  return (
    <div className="dashboard-container">
      <Header />

      <div className="comm-header">
        <h1 className="comm-title">
          <span className="material-symbols-rounded">group</span> Amigos
        </h1>
        <p className="comm-subtitle">Conecte-se com amigos e explore as suas bibliotecas.</p>
      </div>

      <div className="comm-tabs">
        <button
          className={`comm-tab-btn ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          Minha Rede
          {pendingReceived.length > 0 && (
            <span className="comm-tab-badge">{pendingReceived.length}</span>
          )}
        </button>
        <button
          className={`comm-tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Descobrir Pessoas
        </button>
      </div>

      {activeTab === 'network' && (
        <div className="comm-section">
          {isLoadingNetwork ? (
            <div className="comm-empty">A carregar a sua rede...</div>
          ) : (
            <>
              {pendingReceived.length > 0 && (
                <div className="comm-block">
                  <h3 className="comm-block-title">Pedidos Recebidos</h3>
                  <div className="comm-grid">
                    {pendingReceived.map(({ friendshipId, user }) => (
                      <div key={friendshipId} className="comm-card">
                        <Avatar user={user} />
                        <div className="comm-info">
                          <strong>{user.name}</strong>
                          <span>@{user.username}</span>
                        </div>
                        <div className="comm-actions">
                          <button
                            className="btn-action btn-primary"
                            onClick={() => handleRespondRequest(friendshipId, true)}
                          >
                            Aceitar
                          </button>
                          <button
                            className="btn-action"
                            onClick={() => handleRespondRequest(friendshipId, false)}
                          >
                            Recusar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="comm-block">
                <h3 className="comm-block-title">Meus Amigos ({friends.length})</h3>
                {friends.length === 0 ? (
                  <div className="comm-empty">
                    Ainda não tem amigos na rede. Use a aba Descobrir!
                  </div>
                ) : (
                  <div className="comm-grid">
                    {friends.map(({ user }) => (
                      <div key={user.id} className="comm-card">
                        <Avatar user={user} />
                        <div className="comm-info">
                          <strong>{user.name}</strong>
                          <span>@{user.username}</span>
                        </div>
                        <div className="comm-actions">
                          <button
                            className="btn-action btn-primary"
                            onClick={() => navigate(`/perfil/${user.id}`)}
                          >
                            Ver Perfil
                          </button>
                          <button
                            className="btn-action"
                            onClick={() => handleRemoveFriend(user.id, user.name)}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {pendingSent.length > 0 && (
                <div className="comm-block">
                  <h3 className="comm-block-title" style={{ color: 'var(--text-muted)' }}>
                    Pedidos Enviados (A Aguardar)
                  </h3>
                  <div className="comm-grid">
                    {pendingSent.map(({ user }) => (
                      <div key={user.id} className="comm-card" style={{ opacity: 0.7 }}>
                        <Avatar user={user} />
                        <div className="comm-info">
                          <strong>{user.name}</strong>
                          <span>@{user.username}</span>
                        </div>
                        <div className="comm-actions">
                          <button
                            className="btn-action"
                            onClick={() => handleRemoveFriend(user.id, user.name)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'discover' && (
        <div className="comm-section">
          <div className="comm-search-bar">
            <span className="material-symbols-rounded">search</span>
            <input
              type="text"
              placeholder="Pesquisar por @username ou Nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="comm-grid" style={{ marginTop: '20px' }}>
            {isSearching && <div className="comm-empty">A pesquisar...</div>}

            {!isSearching && searchQuery.length >= 3 && searchResults.length === 0 && (
              <div className="comm-empty">Nenhum utilizador encontrado.</div>
            )}

            {!isSearching &&
              searchResults.map((user) => {
                const isFriend = friends.some((f) => f.user.id === user.id);
                const isPending =
                  pendingSent.some((p) => p.user.id === user.id) ||
                  pendingReceived.some((p) => p.user.id === user.id);

                return (
                  <div key={user.id} className="comm-card">
                    <Avatar user={user} />
                    <div className="comm-info">
                      <strong>{user.name}</strong>
                      <span>@{user.username}</span>
                    </div>
                    <div className="comm-actions">
                      {isFriend ? (
                        <span className="comm-status-badge">Amigo</span>
                      ) : isPending ? (
                        <span className="comm-status-badge pending">Pendente</span>
                      ) : (
                        <button
                          className="btn-action btn-primary"
                          onClick={() => handleSendRequest(user.id)}
                        >
                          <span className="material-symbols-rounded">person_add</span> Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
