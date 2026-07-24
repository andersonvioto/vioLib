import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

// Contextos
import { LibraryContext } from '../contexts/LibraryContext';
import { ThemeContext } from '../contexts/ThemeContext';

// Componentes
import Header from '../components/Header';
import FilterDrawer from '../components/FilterDrawer';
import Shelf from '../components/Shelf';
import BookCard from '../components/BookCard';

// Estilos
import './dashboard.css';

/**
 * Componente interno do Skeleton Screen, adaptado para os 3 modos de visualização.
 */
const SkeletonCard = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <div className="skeleton-card-list">
        <div className="skeleton-img-list"></div>
        <div className="skeleton-info-list">
          <div className="skeleton-line title" style={{ width: '40%' }}></div>
          <div className="skeleton-line author" style={{ width: '20%' }}></div>
          <div className="skeleton-line" style={{ width: '60%', marginTop: '10px' }}></div>
        </div>
      </div>
    );
  }

  // Modos 'grid' ou 'compact' partilham a mesma estrutura base, muda apenas o CSS pai
  return (
    <div className="skeleton-card">
      <div className="skeleton-img"></div>
      <div className="skeleton-info">
        <div className="skeleton-line title"></div>
        <div className="skeleton-line author"></div>
        {viewMode !== 'compact' && (
          <div className="skeleton-tags">
            <div className="skeleton-tag"></div>
            <div className="skeleton-tag" style={{ width: '55px' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Tela Principal da Biblioteca (Dashboard).
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { currentLibrary } = useContext(LibraryContext);
  const { viewMode, setViewMode } = useContext(ThemeContext); // Extração do estado de visualização

  const [myBooks, setMyBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalBooks, setTotalBooks] = useState(0);

  // Lemos os filtros ativos diretamente da URL
  const urlSearch = searchParams.get('search') || '';
  const urlGenre = searchParams.get('genre') || '';
  const urlSubgenre = searchParams.get('subgenre') || '';
  const urlTag = searchParams.get('tag') || '';
  const urlAuthor = searchParams.get('author') || '';
  const urlTranslator = searchParams.get('translator') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);

  // Preferências persistentes do Usuário
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('violib_sortBy') || 'title');
  const [sortOrder, setSortOrder] = useState(
    () => localStorage.getItem('violib_sortOrder') || 'ASC'
  );
  const [showOnlyBorrowed, setShowOnlyBorrowed] = useState(
    () => localStorage.getItem('violib_showOnlyBorrowed') === 'true'
  );
  const [showTagsOnCards, setShowTagsOnCards] = useState(() => {
    const saved = localStorage.getItem('violib_showTagsOnCards');
    return saved !== null ? saved === 'true' : true;
  });

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // Sincronização e Debounce da busca
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

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

  // Manipuladores de Filtros (Shelfs)
  const handleSelectGenre = (genreValue) => {
    const newParams = new URLSearchParams(searchParams);
    if (genreValue) newParams.set('genre', genreValue);
    else newParams.delete('genre');
    newParams.delete('subgenre');
    setSearchParams(newParams);
  };

  const handleSelectSubgenre = (subgenreValue) => {
    const newParams = new URLSearchParams(searchParams);
    if (subgenreValue) newParams.set('subgenre', subgenreValue);
    else newParams.delete('subgenre');
    setSearchParams(newParams);
  };

  const handleSelectTag = (tagValue) => {
    const newParams = new URLSearchParams(searchParams);
    if (tagValue) newParams.set('tag', tagValue);
    else newParams.delete('tag');
    setSearchParams(newParams);
  };

  const handleClearStrictFilter = (paramKey) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(paramKey);
    setSearchParams(newParams);
  };

  // Salvar preferências de ordenação
  useEffect(() => {
    localStorage.setItem('violib_sortBy', sortBy);
    localStorage.setItem('violib_sortOrder', sortOrder);
    localStorage.setItem('violib_showOnlyBorrowed', showOnlyBorrowed);
    localStorage.setItem('violib_showTagsOnCards', showTagsOnCards);
  }, [sortBy, sortOrder, showOnlyBorrowed, showTagsOnCards]);

  // Buscar opções dinâmicas para os filtros
  useEffect(() => {
    const params = new URLSearchParams();
    params.append('usedOnly', 'true');
    if (currentLibrary) {
      params.append('ownerId', currentLibrary.ownerId);
    }

    api
      .get(`/attributes?${params.toString()}`)
      .then((res) => {
        setAvailableGenres(res.data.genres || []);
        setAvailableTags(res.data.tags || []);
      })
      .catch(console.error);
  }, [currentLibrary]);

  // Motor de Busca
  const fetchBooks = useCallback(
    async (targetPage, isReset = false) => {
      setIsLoading(true);
      if (isReset) setMyBooks([]);

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
          borrowed: showOnlyBorrowed ? 'true' : 'false'
        });

        const endpoint = currentLibrary
          ? `/access/${currentLibrary.ownerId}/books?${params.toString()}`
          : `/books?${params.toString()}`;

        const response = await api.get(endpoint);

        let fetchedBooks = [];
        let totalItems = 0;
        let totalPages = 1;

        if (response.data.books) {
          fetchedBooks = response.data.books;
          totalItems = response.data.totalItems || 0;
          totalPages = response.data.totalPages || 1;
        } else if (Array.isArray(response.data)) {
          fetchedBooks = response.data;
          totalItems = response.data.length;
          totalPages = 1;
        }

        if (isReset) {
          setMyBooks(fetchedBooks);
        } else {
          setMyBooks((prev) => [...prev, ...fetchedBooks]);
        }

        setTotalBooks(totalItems);
        setHasMore(targetPage < totalPages);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      urlSearch,
      urlGenre,
      urlSubgenre,
      urlTag,
      urlAuthor,
      urlTranslator,
      sortBy,
      sortOrder,
      showOnlyBorrowed,
      currentLibrary,
      navigate
    ]
  );

  useEffect(() => {
    setPage(1);
    fetchBooks(1, true);
  }, [fetchBooks]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBooks(nextPage, false);
  };

  const activeGenreObj = availableGenres.find(
    (g) => g.name?.trim().toLowerCase() === urlGenre?.trim().toLowerCase()
  );
  const activeSubgenres = activeGenreObj
    ? activeGenreObj.Subgenres || activeGenreObj.subgenres || []
    : [];

  const libraryOwnerName = currentLibrary
    ? currentLibrary.ownerName ||
      currentLibrary.Owner?.name ||
      currentLibrary.User?.name ||
      'Convidado'
    : '';

  const renderSectionTitle = () => {
    if (urlAuthor) return `Obras de ${urlAuthor}`;
    if (urlTranslator) return `Traduções de ${urlTranslator}`;
    if (urlSubgenre) return urlSubgenre;
    if (urlGenre) return urlGenre;
    if (currentLibrary) return `Acervo de ${libraryOwnerName}`;
    return 'Minha Biblioteca';
  };

  return (
    <div className="dashboard-container">
      <Header />

      <div className="search-filter-bar">
        <div className="search-wrapper">
          <span className="material-symbols-rounded search-icon">search</span>
          <input
            type="text"
            placeholder="Pesquisar por título ou autor..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Toggles de Visualização Rápida no Dashboard */}
        <div className="view-mode-toggles">
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Visualização em Grelha"
          >
            <span className="material-symbols-rounded">grid_view</span>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'compact' ? 'active' : ''}`}
            onClick={() => setViewMode('compact')}
            title="Visualização Compacta"
          >
            <span className="material-symbols-rounded">apps</span>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
          >
            <span className="material-symbols-rounded">view_list</span>
          </button>
        </div>

        <button
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
        setSelectedTag={handleSelectTag}
        availableTags={availableTags}
        showOnlyBorrowed={showOnlyBorrowed}
        setShowOnlyBorrowed={setShowOnlyBorrowed}
        showTagsOnCards={showTagsOnCards}
        setShowTagsOnCards={setShowTagsOnCards}
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
          <span className="material-symbols-rounded section-icon">
            {urlAuthor
              ? 'person'
              : urlTranslator
                ? 'translate'
                : urlSubgenre || urlGenre
                  ? 'folder_open'
                  : 'local_library'}
          </span>
          <h2
            className="section-title"
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            {renderSectionTitle()}
            <span className="title-count">
              ({isLoading && myBooks.length === 0 ? '...' : totalBooks})
            </span>

            {(urlAuthor || urlTranslator) && (
              <span
                className="material-symbols-rounded"
                onClick={() => handleClearStrictFilter(urlAuthor ? 'author' : 'translator')}
                title="Limpar este filtro"
                style={{
                  fontSize: '20px',
                  color: 'var(--text-danger)',
                  cursor: 'pointer',
                  marginLeft: '5px'
                }}
              >
                cancel
              </span>
            )}
          </h2>
        </div>

        {/* Renderização baseada no ViewMode (Grid, Compact, List) */}
        {isLoading && myBooks.length === 0 ? (
          <div className={`book-layout-${viewMode}`}>
            {Array.from({ length: viewMode === 'compact' ? 14 : 10 }).map((_, idx) => (
              <SkeletonCard key={`skel-init-${idx}`} viewMode={viewMode} />
            ))}
          </div>
        ) : !Array.isArray(myBooks) || myBooks.length === 0 ? (
          <p className="empty-message">Nenhum livro encontrado nesta prateleira.</p>
        ) : (
          <div className={`book-layout-${viewMode}`}>
            {myBooks.map((book) => (
              <BookCard key={book.id} book={book} showTags={showTagsOnCards} viewMode={viewMode} />
            ))}

            {isLoading &&
              myBooks.length > 0 &&
              Array.from({ length: 5 }).map((_, idx) => (
                <SkeletonCard key={`skel-more-${idx}`} viewMode={viewMode} />
              ))}
          </div>
        )}

        {hasMore && !isLoading && (
          <div className="pagination-trigger-zone">
            <button onClick={handleLoadMore} className="btn-action btn-primary btn-load-more">
              Carregar mais obras
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
