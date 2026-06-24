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

  // 1. Busca Categorias e Tags ao carregar a tela
  useEffect(() => {
    api.get('/attributes')
       .then(res => {
         setAvailableGenres(res.data.genres || []);
         setAvailableTags(res.data.tags || []);
       })
       .catch(console.error);
  }, []);

  // 2. Limpa o subgênero sempre que o gênero principal for alterado
  useEffect(() => {
    setSelectedSubgenre('');
  }, [selectedGenre]);

  // ==========================================
  // LÓGICA DE BUSCA DA API (MOTOR CENTRAL)
  // ==========================================
  const fetchBooks = useCallback(async (resetPage = false) => {
    setIsLoading(true);
    try {
      const currentPage = resetPage ? 1 : page;
      
      const params = new URLSearchParams({
        page: currentPage,
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
      
      // NORMALIZAÇÃO DE DADOS: Garante a compatibilidade independente da rota
      let fetchedBooks = [];
      let totalItems = 0;
      let totalPages = 1;

      if (response.data.books) {
        // Formato da rota principal (/books)
        fetchedBooks = response.data.books;
        totalItems = response.data.totalItems || 0;
        totalPages = response.data.totalPages || 1;
      } else if (Array.isArray(response.data)) {
        // Formato da rota de acesso (/access/ID/books), se retornar um array puro
        fetchedBooks = response.data;
        totalItems = response.data.length;
        totalPages = 1;
      }

      if (resetPage) {
        setMyBooks(fetchedBooks);
      } else {
        setMyBooks(prev => [...prev, ...fetchedBooks]);
      }
      
      setTotalBooks(totalItems);
      setHasMore(currentPage < totalPages);
      
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, sortBy, sortOrder, selectedGenre, selectedSubgenre, selectedTag, showOnlyBorrowed, currentLibrary, navigate]);

  // Dispara uma nova busca limpa (Página 1) quando qualquer filtro ou biblioteca mudar
  useEffect(() => {
    setPage(1);
    fetchBooks(true);
  }, [searchTerm, sortBy, sortOrder, selectedGenre, selectedSubgenre, selectedTag, showOnlyBorrowed, currentLibrary, fetchBooks]);

  // Busca a próxima página ao rolar/clicar no botão "Carregar mais"
  useEffect(() => {
    if (page > 1) fetchBooks(false);
  }, [page, fetchBooks]);

  // Variável auxiliar para descobrir os subgêneros do gênero ativo
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
            <span className="title-count">({totalBooks})</span>
          </h2>
        </div>
        
        {!Array.isArray(myBooks) || myBooks.length === 0 ? (
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
          </div>
        )}

        {/* Paginação */}
        {hasMore && (
          <div className="pagination-trigger-zone">
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={isLoading} 
              className="btn-action btn-primary btn-load-more"
            >
              {isLoading ? 'A sincronizar dados...' : 'Carregar mais obras'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;