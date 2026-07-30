import { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import miniLogo from '../assets/violib-logo.png';
import './Header.css';

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

const timeAgo = (dateInput) => {
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' anos atrás';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' meses atrás';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' dias atrás';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' horas atrás';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' min atrás';
  return 'Agora mesmo';
};

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, socket } = useContext(AuthContext);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setIsNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    await Promise.resolve();
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  }, []);

  useEffect(() => {
    const loadNotifs = async () => {
      await fetchNotifications();
    };
    loadNotifs();

    if (socket) {
      const handleNewNotif = () => {
        fetchNotifications();
      };
      socket.on('new_notification', handleNewNotif);
      return () => socket.off('new_notification', handleNewNotif);
    }
  }, [socket, fetchNotifications]);

  const handleReadNotification = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (e) {
        console.error(e);
      }
    }

    setIsNotifMenuOpen(false);

    if (notif.type === 'friend_request') navigate('/comunidade');
    if (notif.type === 'friend_accepted') navigate(`/perfil/${notif.senderId}`);
    if (notif.type === 'new_comment') navigate(`/livro/${notif.referenceId}`);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const avatarSrc = getAvatarUrl(user?.avatarUrl);

  const renderNotifMessage = (type, senderName) => {
    switch (type) {
      case 'friend_request':
        return (
          <span>
            <strong>{senderName}</strong> enviou um pedido de amizade.
          </span>
        );
      case 'friend_accepted':
        return (
          <span>
            <strong>{senderName}</strong> aceitou o seu pedido de amizade.
          </span>
        );
      case 'new_comment':
        return (
          <span>
            <strong>{senderName}</strong> comentou num livro do seu acervo.
          </span>
        );
      default:
        return (
          <span>
            Nova notificação de <strong>{senderName}</strong>.
          </span>
        );
    }
  };

  return (
    <header className="dash-header">
      <div className="dash-header-inner">
        <div className="brand-container">
          <div
            className="brand-clickable"
            onClick={() => navigate('/biblioteca')}
            role="button"
            tabIndex="0"
            aria-label="Ir para a Biblioteca Inicial"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/biblioteca');
              }
            }}
          >
            <img src={miniLogo} alt="" className="brand-logo" aria-hidden="true" />
            <span className="brand-text">vioLib</span>
          </div>
        </div>

        <div className="user-actions-container">
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>

          <nav
            className={`header-actions ${isMobileMenuOpen ? 'open' : ''}`}
            aria-label="Ações principais do acervo"
          >
            <button
              onClick={() => {
                navigate('/biblioteca');
                setIsMobileMenuOpen(false);
              }}
              className="btn-action"
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                library_books
              </span>
              <span className="action-label">Biblioteca</span>
            </button>

            <button
              onClick={() => {
                navigate('/colecoes');
                setIsMobileMenuOpen(false);
              }}
              className="btn-action"
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                workspace_premium
              </span>
              <span className="action-label">Coleções</span>
            </button>

            <button
              onClick={() => {
                navigate('/comunidade');
                setIsMobileMenuOpen(false);
              }}
              className="btn-action"
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                group
              </span>
              <span className="action-label">Amigos</span>
            </button>

            <button
              onClick={() => {
                navigate('/novo-livro');
                setIsMobileMenuOpen(false);
              }}
              className="btn-action btn-primary"
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                library_add
              </span>
              <span className="action-label">Novo</span>
            </button>

            <button onClick={logout} className="btn-action btn-logout mobile-only-logout">
              <span className="material-symbols-rounded" aria-hidden="true">
                logout
              </span>
              <span className="action-label">Sair</span>
            </button>
          </nav>

          <div className="personal-area-container">
            <div className="profile-dropdown-wrapper" ref={notifMenuRef}>
              <button
                className="btn-notification"
                aria-label="Notificações"
                onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
              >
                <span className="material-symbols-rounded">notifications</span>
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotifMenuOpen && (
                <div className="notification-dropdown-menu">
                  <div className="notif-dropdown-header">
                    <strong>Notificações</strong>
                    {unreadCount > 0 && (
                      <button className="btn-mark-read" onClick={handleMarkAllRead}>
                        Marcar todas lidas
                      </button>
                    )}
                  </div>

                  <div className="notif-list-container">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">Nenhum aviso novo.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                          onClick={() => handleReadNotification(notif)}
                        >
                          <div className="notif-avatar">
                            {notif.Sender?.avatarUrl ? (
                              <img src={getAvatarUrl(notif.Sender.avatarUrl)} alt="Avatar" />
                            ) : (
                              <div className="notif-initials">
                                {getInitials(notif.Sender?.name)}
                              </div>
                            )}
                          </div>
                          <div className="notif-content">
                            <p>{renderNotifMessage(notif.type, notif.Sender?.name)}</p>
                            <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                          </div>
                          {!notif.isRead && <div className="notif-dot-indicator"></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-dropdown-wrapper" ref={profileMenuRef}>
              <button
                className="btn-avatar"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-label="Menu do Perfil"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar do Usuário" className="avatar-image" />
                ) : (
                  <span className="avatar-initials">{getInitials(user?.name)}</span>
                )}
              </button>

              {isProfileMenuOpen && (
                <div className="profile-dropdown-menu">
                  <div className="profile-dropdown-header">
                    <strong>{user?.name}</strong>
                    <span>@{user?.username || 'sem_username'}</span>
                  </div>

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        navigate('/moderacao');
                        setIsProfileMenuOpen(false);
                      }}
                      className="dropdown-item"
                      style={{ color: 'var(--text-danger)' }}
                    >
                      <span className="material-symbols-rounded">admin_panel_settings</span> Painel
                      Admin
                    </button>
                  )}

                  <button
                    onClick={() => {
                      navigate('/configuracoes');
                      setIsProfileMenuOpen(false);
                    }}
                    className="dropdown-item"
                  >
                    <span className="material-symbols-rounded">settings</span> Configurações
                  </button>

                  <div className="dropdown-divider"></div>

                  <button onClick={logout} className="dropdown-item danger">
                    <span className="material-symbols-rounded">logout</span> Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
