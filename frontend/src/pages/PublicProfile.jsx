import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import BookCard from '../components/BookCard';
import ReportModal from '../components/ReportModal';
import { ThemeContext } from '../contexts/ThemeContext';
import { getCoverUrl } from '../utils/bookHelpers';
import './PublicProfile.css';

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

const PublicProfile = () => {
  const { friendId } = useParams(); // Usamos friendId de forma robusta como o ID do alvo
  const navigate = useNavigate();
  const { viewMode } = useContext(ThemeContext);

  const [activeTab, setActiveTab] = useState('books');
  const [owner, setOwner] = useState(null);

  // Estados de Paginação dos Livros
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalBooks, setTotalBooks] = useState(0);

  const [collections, setCollections] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [colErrorMsg, setColErrorMsg] = useState('');

  // UGC: Estados de Moderação e Menus
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Novos estados para o Modal Moderno de Bloqueio (Substituindo o window.confirm)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState('');

  const modMenuRef = useRef(null);

  // Click-outside listener para o menu de moderação
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modMenuRef.current && !modMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfileData = useCallback(
    async (targetPage = 1) => {
      await Promise.resolve();

      if (targetPage === 1) {
        setIsLoading(true);
        setPage(1);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const booksRes = await api.get(
          `/public-library/${friendId}/books?limit=20&page=${targetPage}`
        );
        setOwner(booksRes.data.owner);
        setTotalBooks(booksRes.data.totalItems || 0);

        const newBooks = booksRes.data.books || [];
        if (targetPage === 1) {
          setBooks(newBooks);
        } else {
          setBooks((prev) => [...prev, ...newBooks]);
        }

        setHasMore(targetPage < (booksRes.data.totalPages || 1));

        if (targetPage === 1) {
          try {
            const colRes = await api.get(`/public-library/${friendId}/collections`);
            setCollections(colRes.data || []);
          } catch (colErr) {
            if (colErr.response?.status === 403) {
              setColErrorMsg('Este usuário configurou as suas coleções como privadas.');
            }
          }
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setErrorMsg(
            'Acesso negado ou restrito pelas configurações de privacidade deste usuário.'
          );
        } else {
          setErrorMsg('Erro ao carregar perfil.');
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [friendId]
  );

  useEffect(() => {
    const initFetch = async () => {
      await fetchProfileData(1);
    };
    initFetch();
  }, [fetchProfileData]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProfileData(nextPage);
  };

  const executeBlockUser = async () => {
    setIsBlockLoading(true);
    setBlockError('');
    try {
      // Usa friendId diretamente, garantindo que o ID é enviado independente do payload do GET
      await api.post('/blocks', { blockedId: friendId });
      navigate('/comunidade'); // Redirecionamento limpo sem alert()
    } catch (error) {
      setBlockError(error.response?.data?.error || 'Erro ao bloquear usuário.');
      setIsBlockLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <Header />
        <div className="profile-loading">
          <span className="material-symbols-rounded spinner-icon">sync</span> A aceder à
          biblioteca...
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="dashboard-container">
        <Header />
        <div className="profile-error-state">
          <span className="material-symbols-rounded">lock</span>
          <h2>Acesso Restrito</h2>
          <p>{errorMsg}</p>
          <button className="btn-action btn-primary" onClick={() => navigate('/comunidade')}>
            Voltar à Comunidade
          </button>
        </div>
      </div>
    );
  }

  const avatarSrc = getAvatarUrl(owner?.avatarUrl);

  return (
    <div className="dashboard-container">
      <Header />

      {/* Modal de Denúncia injetando explicitamente o ID do amigo para evitar falhas */}
      {isReportModalOpen && owner && (
        <ReportModal
          targetUser={{ ...owner, id: friendId }}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* Modal Moderno de Confirmação de Bloqueio (Substitui o window.confirm e alert) */}
      {isBlockModalOpen && (
        <div className="report-modal-overlay" onClick={() => setIsBlockModalOpen(false)}>
          <div
            className="report-modal-box"
            style={{ maxWidth: '400px', padding: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                color: 'var(--text-danger)',
                marginTop: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="material-symbols-rounded">block</span> Bloquear Usuário
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', margin: '15px 0' }}>
              Tem a certeza que deseja bloquear <strong>{owner?.name}</strong>? Vocês deixarão de
              ser amigos e não poderão ver os perfis ou comentários um do outro.
            </p>

            {blockError && (
              <div
                style={{
                  padding: '10px',
                  background: 'rgba(255,0,0,0.1)',
                  color: 'var(--text-danger)',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  fontSize: '0.9em'
                }}
              >
                {blockError}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '10px'
              }}
            >
              <button
                className="btn-action"
                onClick={() => setIsBlockModalOpen(false)}
                disabled={isBlockLoading}
              >
                Cancelar
              </button>
              <button
                className="btn-action btn-danger"
                onClick={executeBlockUser}
                disabled={isBlockLoading}
              >
                {isBlockLoading ? 'A Bloquear...' : 'Sim, Bloquear'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-hero" style={{ position: 'relative' }}>
        <div
          className="profile-mod-menu"
          ref={modMenuRef}
          style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 100 }}
        >
          <button
            className="btn-action"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: '#fff',
              padding: '8px',
              borderRadius: '50%'
            }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Opções do Perfil"
          >
            <span className="material-symbols-rounded">more_vert</span>
          </button>

          {isMenuOpen && (
            <div
              className="profile-dropdown-menu"
              style={{
                position: 'absolute',
                right: '0',
                top: 'calc(100% + 5px)',
                width: '210px',
                zIndex: 101,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                overflow: 'hidden'
              }}
            >
              <button
                className="dropdown-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsReportModalOpen(true);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  textAlign: 'left',
                  padding: '12px'
                }}
              >
                <span className="material-symbols-rounded">report</span> Denunciar Perfil
              </button>
              <div className="dropdown-divider" style={{ margin: 0 }}></div>
              <button
                className="dropdown-item danger"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsBlockModalOpen(true);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  textAlign: 'left',
                  padding: '12px'
                }}
              >
                <span className="material-symbols-rounded">block</span> Bloquear Usuário
              </button>
            </div>
          )}
        </div>

        <div className="profile-hero-avatar">
          {avatarSrc ? (
            <img src={avatarSrc} alt={owner?.name} />
          ) : (
            <div className="profile-hero-initials">{getInitials(owner?.name)}</div>
          )}
        </div>
        <div className="profile-hero-info">
          <h1>{owner?.name}</h1>
          <span>@{owner?.username}</span>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab-btn ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          <span className="material-symbols-rounded">library_books</span> Livros ({totalBooks})
        </button>
        <button
          className={`profile-tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          <span className="material-symbols-rounded">workspace_premium</span> Coleções
        </button>
      </div>

      {activeTab === 'books' && (
        <div className="profile-content">
          {books.length === 0 ? (
            <div className="profile-empty">Esta biblioteca está vazia.</div>
          ) : (
            <>
              <div className={`book-layout-${viewMode}`}>
                {books.map((book) => (
                  <BookCard key={book.id} book={book} showTags={true} viewMode={viewMode} />
                ))}
              </div>

              {hasMore && (
                <div
                  className="pagination-trigger-zone"
                  style={{ marginTop: '30px', textAlign: 'center' }}
                >
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="btn-action btn-primary btn-load-more"
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? 'A carregar...' : 'Carregar mais obras'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'collections' && (
        <div className="profile-content">
          {colErrorMsg ? (
            <div className="profile-empty">
              <span
                className="material-symbols-rounded"
                style={{ fontSize: '3em', color: 'var(--text-muted)' }}
              >
                visibility_off
              </span>
              <br />
              {colErrorMsg}
            </div>
          ) : collections.length === 0 ? (
            <div className="profile-empty">Este usuário ainda não criou coleções.</div>
          ) : (
            <div className="collections-grid">
              {collections.map((col) => {
                const { stats } = col;
                const progressStyle = { '--progress': `${stats.progress}%` };

                return (
                  <div key={col.id} className="collection-album-card" style={{ cursor: 'default' }}>
                    <div
                      className="collection-banner"
                      style={{
                        backgroundImage: col.bannerImage
                          ? `url(${getCoverUrl(col.bannerImage)})`
                          : 'none'
                      }}
                    >
                      <div className="banner-overlay"></div>
                      <div className="progress-ring-container" style={progressStyle}>
                        <div className="progress-ring-inner">
                          <span className="progress-value">{stats.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="collection-info">
                      <h3 className="collection-title">{col.title}</h3>
                      <div className="collection-stats-bar">
                        <span className="stat-pill">
                          <span className="material-symbols-rounded">book</span>
                          {stats.ownedItems} / {stats.totalItems} Adquiridos
                        </span>
                      </div>
                      {col.description && <p className="collection-desc">{col.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
