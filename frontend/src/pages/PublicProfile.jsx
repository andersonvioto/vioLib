import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

import Header from '../components/Header';
import BookCard from '../components/BookCard';
import ReportModal from '../components/ReportModal';
import FilterDrawer from '../components/FilterDrawer';
import Shelf from '../components/Shelf';
import { ThemeContext } from '../contexts/ThemeContext';
import { getCoverUrl } from '../utils/bookHelpers';
import useNetworkStatus from '../hooks/useNetworkStatus';

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
  const { friendId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { viewMode, setViewMode } = useContext(ThemeContext);
  const isOnline = useNetworkStatus();

  const [activeTab, setActiveTab] = useState('books');
  const [owner, setOwner] = useState(null);

  // Estados dos Filtros na URL
  const urlSearch = searchParams.get('search') || '';
  const urlGenre = searchParams.get('genre') || '';
  const urlSubgenre = searchParams.get('subgenre') || '';
  const urlTag = searchParams.get('tag') || '';
  const urlAuthor = searchParams.get('author') || '';
  const urlTranslator = searchParams.get('translator') || '';
  const urlReadingStatus = searchParams.get('readingStatus') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('violib_sortBy') || 'title');
  const [sortOrder, setSortOrder] = useState(
    () => localStorage.getItem('violib_sortOrder') || 'ASC'
  );

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // Estados de Dados e Paginação
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
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState('');

  const modMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modMenuRef.current && !modMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchInput !== urlSearch) {
        const newParams = new URLSearchParams(searchParams);
        if (searchInput) newParams.set('search', searchInput);
        else newParams.delete('search');
        setSearchParams(newParams);
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, urlSearch, searchParams, setSearchParams]);

  useEffect(() => {
    if (!isOnline) return;
    const fetchAttributes = async () => {
      await Promise.resolve();
      try {
        const res = await api.get(`/attributes?usedOnly=true&ownerId=${friendId}`);
        setAvailableGenres(res.data.genres || []);
        setAvailableTags(res.data.tags || []);
      } catch (error) {
        console.error('Erro ao buscar filtros do amigo', error);
      }
    };
    fetchAttributes();
  }, [friendId, isOnline]);

  const fetchProfileData = useCallback(
    async (targetPage, isReset = false) => {
      if (!isOnline) return;
      await Promise.resolve();
      if (isReset) {
        setIsLoading(true);
        setBooks([]);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          page: targetPage,
          limit: 20,
          search: urlSearch,
          sortBy: sortBy,
          order: sortOrder,
          genre: urlGenre,
          subgenre: urlSubgenre,
          tag: urlTag,
          author: urlAuthor,
          translator: urlTranslator,
          readingStatus: urlReadingStatus
        });

        const booksRes = await api.get(`/public-library/${friendId}/books?${params.toString()}`);

        setOwner(booksRes.data.owner);
        setTotalBooks(booksRes.data.totalItems || 0);

        const newBooks = booksRes.data.books || [];
        if (isReset) {
          setBooks(newBooks);
        } else {
          setBooks((prev) => [...prev, ...newBooks]);
        }

        setHasMore(targetPage < (booksRes.data.totalPages || 1));

        if (isReset) {
          try {
            const colRes = await api.get(`/public-library/${friendId}/collections`);
            setCollections(colRes.data || []);
          } catch (colErr) {
            if (colErr.response?.status === 403) {
              setColErrorMsg('Este utilizador configurou as suas coleções como privadas.');
            }
          }
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setErrorMsg(
            'Acesso negado ou restrito pelas configurações de privacidade deste utilizador.'
          );
        } else {
          setErrorMsg('Erro ao carregar perfil.');
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      friendId,
      urlSearch,
      urlGenre,
      urlSubgenre,
      urlTag,
      urlAuthor,
      urlTranslator,
      urlReadingStatus,
      sortBy,
      sortOrder,
      isOnline
    ]
  );

  useEffect(() => {
    if (isOnline) {
      const initFetch = async () => {
        setPage(1);
        await fetchProfileData(1, true);
      };
      initFetch();
    }
  }, [fetchProfileData, isOnline]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProfileData(nextPage, false);
  };

  const executeBlockUser = async () => {
    setIsBlockLoading(true);
    setBlockError('');
    try {
      await api.post('/blocks', { blockedId: friendId });
      navigate('/comunidade');
    } catch (error) {
      setBlockError(error.response?.data?.error || 'Erro ao bloquear utilizador.');
      setIsBlockLoading(false);
    }
  };

  const handleSelectGenre = (val) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('genre', val);
    else newParams.delete('genre');
    newParams.delete('subgenre');
    setSearchParams(newParams);
  };

  const handleSelectSubgenre = (val) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('subgenre', val);
    else newParams.delete('subgenre');
    setSearchParams(newParams);
  };

  const handleClearStrictFilter = (paramKey) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(paramKey);
    setSearchParams(newParams);
  };

  // ==========================================
  // BARREIRA OFFLINE
  // ==========================================
  if (!isOnline) {
    return (
      <div className="dashboard-container">
        <Header />
        <div
          className="profile-empty"
          style={{
            marginTop: '80px',
            padding: '60px 20px',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <span
            className="material-symbols-rounded"
            style={{ fontSize: '4em', color: 'var(--text-muted)', marginBottom: '15px' }}
          >
            cloud_off
          </span>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Modo Offline Ativo</h2>
          <p
            style={{
              marginBottom: '25px',
              maxWidth: '400px',
              margin: '0 auto 25px auto',
              color: 'var(--text-secondary)'
            }}
          >
            Não é possível carregar o perfil de outras pessoas sem conexão à Internet.
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

  if (isLoading && books.length === 0) {
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
  const activeGenreObj = availableGenres.find(
    (g) => g.name?.trim().toLowerCase() === urlGenre?.trim().toLowerCase()
  );
  const activeSubgenres = activeGenreObj
    ? activeGenreObj.Subgenres || activeGenreObj.subgenres || []
    : [];

  const renderSectionTitle = () => {
    if (urlAuthor) return `Obras de ${urlAuthor}`;
    if (urlTranslator) return `Traduções de ${urlTranslator}`;
    if (urlSubgenre) return urlSubgenre;
    if (urlGenre) return urlGenre;
    return 'Acervo do Amigo';
  };

  return (
    <div className="dashboard-container">
      <Header />

      {isReportModalOpen && owner && (
        <ReportModal
          targetUser={{ ...owner, id: friendId }}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

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
              <span className="material-symbols-rounded">block</span> Bloquear Utilizador
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
                <span className="material-symbols-rounded">block</span> Bloquear Utilizador
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
          <div
            className="search-filter-bar"
            role="search"
            aria-label="Pesquisar e filtrar obras do amigo"
          >
            <div className="search-wrapper">
              <span className="material-symbols-rounded search-icon">search</span>
              <input
                type="text"
                placeholder={`Pesquisar na biblioteca de ${owner?.name}...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="view-mode-toggles">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <span className="material-symbols-rounded">grid_view</span>
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'compact' ? 'active' : ''}`}
                onClick={() => setViewMode('compact')}
              >
                <span className="material-symbols-rounded">apps</span>
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <span className="material-symbols-rounded">view_list</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              className={`btn-action btn-filter-trigger ${isFilterDrawerOpen ? 'active' : ''}`}
            >
              <span className="material-symbols-rounded">tune</span>
              <span className="action-label">Filtros</span>
            </button>
          </div>

          <FilterDrawer
            isOpen={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            selectedTag={urlTag}
            setSelectedTag={(val) => {
              const p = new URLSearchParams(searchParams);
              if (val) p.set('tag', val);
              else p.delete('tag');
              setSearchParams(p);
            }}
            readingStatus={urlReadingStatus}
            setReadingStatus={(val) => {
              const p = new URLSearchParams(searchParams);
              if (val) p.set('readingStatus', val);
              else p.delete('readingStatus');
              setSearchParams(p);
            }}
            availableTags={availableTags}
            showOnlyBorrowed={false}
            setShowOnlyBorrowed={() => {}}
            showTagsOnCards={true}
            setShowTagsOnCards={() => {}}
          />

          <Shelf
            items={availableGenres}
            activeItem={urlGenre}
            onSelect={handleSelectGenre}
            defaultLabel="Toda a Biblioteca"
          />
          {activeSubgenres.length > 0 && (
            <Shelf
              items={activeSubgenres}
              activeItem={urlSubgenre}
              onSelect={handleSelectSubgenre}
              defaultLabel={`Todos em ${activeGenreObj.name}`}
              isSubgenre={true}
            />
          )}

          <div className="library-section">
            <div className="section-header">
              <h2
                className="section-title"
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                {renderSectionTitle()} <span className="title-count">({totalBooks})</span>
                {(urlAuthor || urlTranslator || urlReadingStatus) && (
                  <button
                    type="button"
                    className="btn-clear-filter"
                    onClick={() => {
                      if (urlAuthor) handleClearStrictFilter('author');
                      else if (urlTranslator) handleClearStrictFilter('translator');
                      else if (urlReadingStatus) handleClearStrictFilter('readingStatus');
                    }}
                    title="Limpar filtro"
                  >
                    <span className="material-symbols-rounded">cancel</span>
                  </button>
                )}
              </h2>
            </div>

            {books.length === 0 ? (
              <p className="empty-message">Nenhuma obra encontrada nesta prateleira.</p>
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
            <div className="profile-empty">Este utilizador ainda não criou coleções.</div>
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
