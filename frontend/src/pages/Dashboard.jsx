import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

import { ThemeContext } from '../contexts/ThemeContext';
import Header from '../components/Header';
import FilterDrawer from '../components/FilterDrawer';
import Shelf from '../components/Shelf';
import BookCard from '../components/BookCard';
import BookContextMenu from '../components/BookContextMenu';

import './dashboard.css';

const SkeletonCard = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <div className="skeleton-card-list" aria-hidden="true">
        <div className="skeleton-img-list"></div>
        <div className="skeleton-info-list">
          <div className="skeleton-line title" style={{ width: '40%' }}></div>
          <div className="skeleton-line author" style={{ width: '20%' }}></div>
          <div className="skeleton-line" style={{ width: '60%', marginTop: '10px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-card" aria-hidden="true">
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { viewMode, setViewMode } = useContext(ThemeContext);

  const [myBooks, setMyBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalBooks, setTotalBooks] = useState(0);

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
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (contextMenu && window.innerWidth > 600) setContextMenu(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [contextMenu]);

  const handleContextMenu = useCallback((e, book, isTouch = false) => {
    e.preventDefault();
    let x = e.clientX;
    let y = e.clientY;
    if (isTouch && e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }
    const menuWidth = 260;
    const menuHeight = 400;
    if (window.innerWidth > 600) {
      if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
      if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;
    }
    setContextMenu({ x, y, book });
  }, []);

  const handleUpdateStatus = async (book, newStatus) => {
    try {
      const payloadForm = new FormData();
      payloadForm.append('title', book.title);
      payloadForm.append('readingStatus', newStatus);
      if (book.Authors)
        payloadForm.append('authors', JSON.stringify(book.Authors.map((a) => a.name)));
      if (book.Translators)
        payloadForm.append('translators', JSON.stringify(book.Translators.map((t) => t.name)));
      if (book.Tags) payloadForm.append('tags', JSON.stringify(book.Tags.map((t) => t.name)));
      if (book.Genres) payloadForm.append('genres', JSON.stringify(book.Genres.map((g) => g.name)));
      if (book.Subgenres)
        payloadForm.append('subgenres', JSON.stringify(book.Subgenres.map((s) => s.name)));

      await api.put(`/books/${book.id}`, payloadForm);
      setMyBooks((prev) =>
        prev.map((b) => (b.id === book.id ? { ...b, readingStatus: newStatus } : b))
      );
    } catch (error) {
      console.error('Erro update status:', error);
      alert('Erro ao atualizar status de leitura.');
    }
  };

  const handleDeleteBook = async (book) => {
    if (window.confirm(`Deseja realmente excluir permanentemente "${book.title}" da biblioteca?`)) {
      try {
        await api.delete(`/books/${book.id}`);
        setMyBooks((prev) => prev.filter((b) => b.id !== book.id));
        setTotalBooks((prev) => prev - 1);
      } catch (error) {
        console.error('Erro delete book:', error);
        alert('Erro ao excluir a obra.');
      }
    }
  };

  useEffect(() => {
    const syncSearch = async () => {
      await Promise.resolve();
      setSearchInput(urlSearch);
    };
    syncSearch();
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

  const handleSelectReadingStatus = (statusValue) => {
    const newParams = new URLSearchParams(searchParams);
    if (statusValue) newParams.set('readingStatus', statusValue);
    else newParams.delete('readingStatus');
    setSearchParams(newParams);
  };

  const handleClearStrictFilter = (paramKey) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(paramKey);
    setSearchParams(newParams);
  };

  useEffect(() => {
    localStorage.setItem('violib_sortBy', sortBy);
    localStorage.setItem('violib_sortOrder', sortOrder);
    localStorage.setItem('violib_showOnlyBorrowed', showOnlyBorrowed);
    localStorage.setItem('violib_showTagsOnCards', showTagsOnCards);
  }, [sortBy, sortOrder, showOnlyBorrowed, showTagsOnCards]);

  useEffect(() => {
    const fetchAttributes = async () => {
      await Promise.resolve();
      try {
        const params = new URLSearchParams();
        params.append('usedOnly', 'true');
        const res = await api.get(`/attributes?${params.toString()}`);
        setAvailableGenres(res.data.genres || []);
        setAvailableTags(res.data.tags || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchAttributes();
  }, []);

  const fetchBooks = useCallback(
    async (targetPage, isReset = false) => {
      await Promise.resolve();
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
          readingStatus: urlReadingStatus,
          borrowed: showOnlyBorrowed ? 'true' : 'false'
        });

        const response = await api.get(`/books?${params.toString()}`);

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

        if (isReset) setMyBooks(fetchedBooks);
        else setMyBooks((prev) => [...prev, ...fetchedBooks]);

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
      urlReadingStatus,
      sortBy,
      sortOrder,
      showOnlyBorrowed,
      navigate
    ]
  );

  useEffect(() => {
    const initFetch = async () => {
      await Promise.resolve();
      setPage(1);
      fetchBooks(1, true);
    };
    initFetch();
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

  const renderSectionTitle = () => {
    if (urlAuthor) return `Obras de ${urlAuthor}`;
    if (urlTranslator) return `Traduções de ${urlTranslator}`;
    if (urlSubgenre) return urlSubgenre;
    if (urlGenre) return urlGenre;
    return 'Minha Biblioteca';
  };

  return (
    <div className="dashboard-container">
      <Header />

      <div className="search-filter-bar" role="search" aria-label="Pesquisar e filtrar obras">
        <div className="search-wrapper">
          <span className="material-symbols-rounded search-icon" aria-hidden="true">
            search
          </span>
          <input
            type="text"
            placeholder="Pesquisar por título ou autor..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
            aria-label="Campo de pesquisa bibliográfica"
          />
        </div>

        <div className="view-mode-toggles" role="group" aria-label="Modo de visualização da grade">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Visualização Padrão"
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              grid_view
            </span>
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'compact' ? 'active' : ''}`}
            onClick={() => setViewMode('compact')}
            title="Visualização Compacta"
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              apps
            </span>
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              view_list
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
          className={`btn-action btn-filter-trigger ${isFilterDrawerOpen ? 'active' : ''}`}
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            tune
          </span>
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
        readingStatus={urlReadingStatus}
        setReadingStatus={handleSelectReadingStatus}
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
          <span className="material-symbols-rounded section-icon" aria-hidden="true">
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
                <span className="material-symbols-rounded" aria-hidden="true">
                  cancel
                </span>
              </button>
            )}
          </h2>
        </div>

        {isLoading && myBooks.length === 0 ? (
          <div className={`book-layout-${viewMode}`}>
            {Array.from({ length: viewMode === 'compact' ? 14 : 10 }).map((_, idx) => (
              <SkeletonCard key={`skel-init-${idx}`} viewMode={viewMode} />
            ))}
          </div>
        ) : !Array.isArray(myBooks) || myBooks.length === 0 ? (
          <p className="empty-message" role="status">
            Nenhum livro encontrado nesta prateleira.
          </p>
        ) : (
          <div className={`book-layout-${viewMode}`}>
            {myBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                showTags={showTagsOnCards}
                viewMode={viewMode}
                onContextMenu={handleContextMenu}
              />
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
            <button
              type="button"
              onClick={handleLoadMore}
              className="btn-action btn-primary btn-load-more"
            >
              Carregar mais obras
            </button>
          </div>
        )}
      </div>

      <BookContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        onUpdateStatus={handleUpdateStatus}
        onDeleteBook={handleDeleteBook}
        isGuest={false}
      />
    </div>
  );
};

export default Dashboard;
