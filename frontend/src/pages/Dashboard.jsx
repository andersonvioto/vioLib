import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Contextos
import { LibraryContext } from '../contexts/LibraryContext';

// Componentes
import Header from '../components/Header'; 
import FilterDrawer from '../components/FilterDrawer';
import Shelf from '../components/Shelf';
import BookCard from '../components/BookCard';

// Estilos
import './dashboard.css';

/**
 * Componente interno do Skeleton Screen.
 * Imita o formato visual do BookCard enquanto os dados estão sendo buscados.
 */
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-img"></div>
    <div className="skeleton-info">
      <div className="skeleton-line title"></div>
      <div className="skeleton-line author"></div>
      <div className="skeleton-tags">
        <div className="skeleton-tag"></div>
        <div className="skeleton-tag" style={{ width: '55px' }}></div>
      </div>
    </div>
  </div>
);

/**
 * Tela Principal da Biblioteca (Dashboard).
 * Atua como o maestro, coordenando os componentes visuais, o estado e as chamadas de API.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  
  // Estado Global: Define de quem é a biblioteca que estamos visualizando
  const { currentLibrary } = useContext(LibraryContext);

  // Estados de Paginação e Dados
  const [myBooks, setMyBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalBooks, setTotalBooks] = useState(0);

  // Estados dos Filtros Ativos
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSubgenre, setSelectedSubgenre] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showOnlyBorrowed, setShowOnlyBorrowed] = useState(false);
  const [showTagsOnCards, setShowTagsOnCards] = useState(true);
  
  // Estados de UI
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // ==========================================
  // EFEITOS INICIAIS E SINCRONIZAÇÃO
  // ==========================================

  // Busca as taxonomias dinamicamente com base na biblioteca atual
  useEffect(() => {
    // 1. Limpa os filtros anteriores para não buscar uma categoria que não existe no amigo
    setSearchTerm('');
    setSelectedGenre('');
    setSelectedSubgenre('');
    setSelectedTag('');

    // 2. Monta os parâmetros para trazer apenas categorias que possuem livros
    const ownerQuery = currentLibrary ? `&ownerId=${currentLibrary.ownerId}` : '';
    
    api.get(`/attributes?usedOnly=true${ownerQuery}`)
       .then(res => {
         setAvailableGenres(res.data.genres || []);
         setAvailableTags(res.data.tags || []);
       })
       .catch(console.error);
  }, [currentLibrary]);

  useEffect(() => {
    setSelectedSubgenre('');
  }, [selectedGenre]);

  // ==========================================
  // LÓGICA DE BUSCA DA API (MOTOR CENTRAL)
  // ==========================================
  
  const fetchBooks = useCallback(async (targetPage, isReset = false) => {
    setIsLoading(true);

    if (isReset) {
      setMyBooks([]);
    }

    try {
      const params = new URLSearchParams({
        page: targetPage,
        limit: 20,
        search: searchTerm,
        sortBy: sortBy,
        order: sortOrder,
        genre: selectedGenre,
        subgenre: selectedSubgenre,
        tag: selectedTag,
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
        setMyBooks(prev => [...prev, ...fetchedBooks]);
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
  }, [searchTerm, sortBy, sortOrder, selectedGenre, selectedSubgenre, selectedTag, showOnlyBorrowed, currentLibrary, navigate]);

  useEffect(() => {
    setPage(1);
    fetchBooks(1, true); 
  }, [fetchBooks]); 

  // ==========================================
  // HANDLERS
  // ==========================================
  
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBooks(nextPage, false); 
  };

  const activeGenreObj = availableGenres.find(g => g.name === selectedGenre);

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  return (
    <div className="dashboard-container">
      {/* 1. CABEÇALHO */}
      <Header />

      {/* 2. BARRA DE PESQUISA E BOTÃO DE FILTRO */}
      <div className="search-filter-bar">
        <div className="search-wrapper">
          <span className="material-symbols-rounded search-icon">search</span>
          <input 
            type="text" 
            placeholder="Pesquisar por título ou autor..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="search-input" 
          />
        </div>
        
        <button 
          onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)} 
          className={`btn-action btn-filter-trigger ${isFilterDrawerOpen ? 'active' : ''}`}
        >
          <span className="material-symbols-rounded">tune</span>
          <span className="action-label">Filtros</span>
        </button>
      </div>

      {/* 3. GAVETA LATERAL DE FILTROS AVANÇADOS */}
      <FilterDrawer 
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        availableTags={availableTags}
        showOnlyBorrowed={showOnlyBorrowed}
        setShowOnlyBorrowed={setShowOnlyBorrowed}
        showTagsOnCards={showTagsOnCards}
        setShowTagsOnCards={setShowTagsOnCards}
      />

      {/* 4. PRATELEIRA PRINCIPAL (GÊNEROS) */}
      <Shelf 
        items={availableGenres}
        activeItem={selectedGenre}
        onSelect={setSelectedGenre}
        defaultLabel="Toda a Biblioteca"
      />

      {/* 5. PRATELEIRA SECUNDÁRIA (SUBGÊNEROS) */}
      {activeGenreObj && activeGenreObj.Subgenres?.length > 0 && (
        <Shelf 
          items={activeGenreObj.Subgenres}
          activeItem={selectedSubgenre}
          onSelect={setSelectedSubgenre}
          defaultLabel={`Todos em ${activeGenreObj.name}`}
          isSubgenre={true}
        />
      )}

      {/* 6. ÁREA DE EXIBIÇÃO DA BIBLIOTECA */}
      <div className="library-section">
        <div className="section-header">
          <span className="material-symbols-rounded section-icon">
            {selectedSubgenre || selectedGenre ? 'folder_open' : 'local_library'}
          </span>
          <h2 className="section-title">
            {selectedSubgenre 
              ? selectedSubgenre 
              : selectedGenre 
                ? selectedGenre 
                : (currentLibrary ? `Acervo de ${currentLibrary.ownerName}` : 'Minha Biblioteca')
            }
            <span className="title-count">({isLoading && myBooks.length === 0 ? '...' : totalBooks})</span>
          </h2>
        </div>
        
        {/* LÓGICA DE RENDERIZAÇÃO INTELIGENTE (SKELETONS VS DADOS) */}
        {isLoading && myBooks.length === 0 ? (
          <div className="book-grid">
            {Array.from({ length: 10 }).map((_, idx) => (
              <SkeletonCard key={`skel-init-${idx}`} />
            ))}
          </div>
        ) : !Array.isArray(myBooks) || myBooks.length === 0 ? (
          <p className="empty-message">Nenhum livro encontrado nesta prateleira.</p>
        ) : (
          <div className="book-grid">
            {myBooks.map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                showTags={showTagsOnCards} 
              />
            ))}
            
            {isLoading && myBooks.length > 0 && (
              Array.from({ length: 5 }).map((_, idx) => (
                <SkeletonCard key={`skel-more-${idx}`} />
              ))
            )}
          </div>
        )}

        {/* Paginação */}
        {hasMore && !isLoading && (
          <div className="pagination-trigger-zone">
            <button 
              onClick={handleLoadMore} 
              className="btn-action btn-primary btn-load-more"
            >
              Carregar mais obras
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;