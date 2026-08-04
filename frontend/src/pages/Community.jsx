import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import useNetworkStatus from '../hooks/useNetworkStatus';
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
  const isOnline = useNetworkStatus();

  const [activeTab, setActiveTab] = useState('network');

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('violib_community_viewMode') || 'grid';
  });

  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    friendId: null,
    friendName: ''
  });

  const showFeedback = (msg, type = 'info') => {
    setFeedback({ type, message: msg });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  useEffect(() => {
    localStorage.setItem('violib_community_viewMode', viewMode);
  }, [viewMode]);

  const fetchNetwork = useCallback(async () => {
    if (!isOnline) return;

    await Promise.resolve();
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
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) {
      const init = async () => {
        await fetchNetwork();
      };
      init();
    }
  }, [fetchNetwork, isOnline]);

  useEffect(() => {
    if (!isOnline) return;

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
  }, [searchQuery, isOnline]);

  const handleSendRequest = async (receiverId) => {
    try {
      await api.post('/friendships/request', { receiverId });
      fetchNetwork();
      showFeedback('Pedido de amizade enviado!', 'success');
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      showFeedback(error.response?.data?.error || 'Erro ao enviar pedido.', 'error');
    }
  };

  const handleRespondRequest = async (friendshipId, accept) => {
    try {
      await api.put(`/friendships/request/${friendshipId}`, { accept });
      fetchNetwork();
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      showFeedback('Erro ao processar pedido.', 'error');
    }
  };

  const executeRemoveFriend = async () => {
    if (!confirmDialog.friendId) return;
    try {
      await api.delete(`/friendships/${confirmDialog.friendId}`);
      fetchNetwork();
      setConfirmDialog({ isOpen: false, friendId: null, friendName: '' });
      showFeedback('Conexão desfeita com sucesso.', 'info');
    } catch (error) {
      console.error('Erro ao remover amigo:', error);
      showFeedback('Erro ao remover amigo.', 'error');
      setConfirmDialog({ isOpen: false, friendId: null, friendName: '' });
    }
  };

  // ==========================================
  // BARREIRA OFFLINE
  // ==========================================
  if (!isOnline) {
    return (
      <div className="dashboard-container">
        <Header />
        <div className="comm-empty" style={{ marginTop: '80px' }}>
          <span
            className="material-symbols-rounded"
            style={{ fontSize: '4em', color: 'var(--text-muted)', marginBottom: '15px' }}
          >
            wifi_off
          </span>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Modo Offline Ativo</h2>
          <p style={{ marginBottom: '25px', maxWidth: '400px', margin: '0 auto 25px auto' }}>
            As funcionalidades da comunidade requerem conexão à Internet. Conecte-se para explorar e
            partilhar a sua biblioteca com os amigos.
          </p>
          <button
            className="btn-action btn-primary"
            onClick={() => navigate('/biblioteca')}
            style={{ margin: '0 auto' }}
          >
            Ir para Minha Biblioteca
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Header />

      {confirmDialog.isOpen && (
        <div
          className="comm-modal-overlay"
          onClick={() => setConfirmDialog({ isOpen: false, friendId: null, friendName: '' })}
        >
          <div className="comm-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="comm-modal-title">
              <span className="material-symbols-rounded">person_remove</span> Desfazer Amizade
            </h2>
            <p className="comm-modal-text">
              Deseja realmente desfazer a conexão com <strong>{confirmDialog.friendName}</strong>?
              Vocês não poderão mais ver as bibliotecas um do outro.
            </p>
            <div className="comm-modal-actions">
              <button
                className="btn-action"
                onClick={() => setConfirmDialog({ isOpen: false, friendId: null, friendName: '' })}
              >
                Cancelar
              </button>
              <button className="btn-action btn-danger" onClick={executeRemoveFriend}>
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="comm-header">
        <h1 className="comm-title">
          <span className="material-symbols-rounded">group</span> Amigos
        </h1>
        <p className="comm-subtitle">Conecte-se com amigos e explore as suas bibliotecas.</p>
      </div>

      {feedback.message && (
        <div className={`comm-feedback-banner ${feedback.type}`}>
          <span className="material-symbols-rounded">
            {feedback.type === 'error'
              ? 'error'
              : feedback.type === 'success'
                ? 'check_circle'
                : 'info'}
          </span>
          {feedback.message}
        </div>
      )}

      <div className="comm-toolbar">
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

        <div className="view-mode-toggles">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Visualização em Grelha"
          >
            <span className="material-symbols-rounded">grid_view</span>
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
          >
            <span className="material-symbols-rounded">view_list</span>
          </button>
        </div>
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
                  <div className={`comm-${viewMode}`}>
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
                  <div className={`comm-${viewMode}`}>
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
                            className="btn-action btn-danger-soft"
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                friendId: user.id,
                                friendName: user.name
                              })
                            }
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
                  <div className={`comm-${viewMode}`}>
                    {pendingSent.map(({ user }) => (
                      <div key={user.id} className="comm-card" style={{ opacity: 0.7 }}>
                        <Avatar user={user} />
                        <div className="comm-info">
                          <strong>{user.name}</strong>
                          <span>@{user.username}</span>
                        </div>
                        <div className="comm-actions">
                          <button
                            className="btn-action btn-danger-soft"
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                friendId: user.id,
                                friendName: user.name
                              })
                            }
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

          <div className={`comm-${viewMode}`} style={{ marginTop: '20px' }}>
            {isSearching && <div className="comm-empty">A pesquisar...</div>}

            {!isSearching && searchQuery.length >= 3 && searchResults.length === 0 && (
              <div className="comm-empty">Nenhum usuário encontrado.</div>
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
