import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './dashboard.css'; 
import miniLogo from '../assets/violib-logo.png'; 

const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%232c2c2c" stroke="%23D4AF37" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  if (filename.startsWith('http')) return filename; 
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
  return `${apiUrl.replace('/api', '/files')}/${filename}`;
};

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [myBooks, setMyBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalBooks, setTotalBooks] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('ASC');
  
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSubgenre, setSelectedSubgenre] = useState(''); // NOVO
  const [selectedTag, setSelectedTag] = useState('');
  
  const [showOnlyBorrowed, setShowOnlyBorrowed] = useState(false);
  const [showTagsOnCards, setShowTagsOnCards] = useState(true); 
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // ==========================================
  // LÓGICA DE ARRASTAR COM O RATO (DRAG TO SCROLL)
  // ==========================================
  const shelfRef = useRef(null);
  const subShelfRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e, ref) => {
    isDragging.current = true;
    ref.current.classList.add('grabbing');
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
  };

  const handleMouseLeaveOrUp = (ref) => {
    isDragging.current = false;
    if (ref.current) ref.current.classList.remove('grabbing');
  };

  const handleMouseMove = (e, ref) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current); // Velocidade do arrasto
    ref.current.scrollLeft = scrollLeft.current - walk;
  };
  
  // Função para as setas de navegação
  const scrollShelf = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 300; // Quantidade de pixels que a lista vai pular
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // ==========================================
  // BUSCA E EFEITOS
  // ==========================================
  useEffect(() => {
    api.get('/attributes')
       .then(res => {
         setAvailableGenres(res.data.genres || []);
         setAvailableTags(res.data.tags || []);
       })
       .catch(console.error);
  }, []);

  // Se o Gênero mudar, limpamos o Subgênero automaticamente
  useEffect(() => {
    setSelectedSubgenre('');
  }, [selectedGenre]);

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
        subgenre: selectedSubgenre, // NOVO
        tag: selectedTag,
        borrowed: showOnlyBorrowed ? 'true' : 'false'
      });

      const response = await api.get(`/books?${params.toString()}`);
      const { books, totalItems, totalPages } = response.data;
      
      if (resetPage) setMyBooks(books);
      else setMyBooks(prev => [...prev, ...books]);
      
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
  }, [page, searchTerm, sortBy, sortOrder, selectedGenre, selectedSubgenre, selectedTag, showOnlyBorrowed, navigate]);

  useEffect(() => {
    setPage(1);
    fetchBooks(true);
  }, [searchTerm, sortBy, sortOrder, selectedGenre, selectedSubgenre, selectedTag, showOnlyBorrowed]);

  useEffect(() => {
    if (page > 1) fetchBooks(false);
  }, [page]);

  const handleShare = async () => {
    const guestEmail = window.prompt("Digite o e-mail do amigo que poderá ver sua biblioteca:");
    if (!guestEmail) return;
    try {
      const response = await api.post('/access/share', { guestEmail });
      alert(response.data.message);
    } catch (error) {
      alert('Erro: ' + (error.response?.data?.error || 'Não foi possível compartilhar.'));
    }
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair da sua conta?")) {
      localStorage.removeItem('token'); 
      navigate('/login'); 
    }
  };

  const BookGrid = ({ books }) => (
    // ... MANTÉM IGUAL O COMPONENTE BookGrid
    <div className="book-grid">
      {books.map((book) => {
        const isBorrowed = book.Loans?.some(loan => !loan.returnDate);
        return (
          <div key={book.id} className="book-card" onClick={() => navigate(`/livro/${book.id}`)}>
            <img src={getCoverUrl(book.coverImage)} alt={book.title} className="book-cover" />
            <div className="book-info">
              <h3 className="book-title">{book.title}</h3>
              <p className="book-author">
                {book.Authors?.length > 0 ? book.Authors[0].name : 'Autor Desconhecido'}
              </p>
              
              {showTagsOnCards && book.Tags?.length > 0 && (
                <div className="card-tags-container">
                  {book.Tags.slice(0, 2).map(tag => (
                    <span key={tag.id} className="card-tag-chip">#{tag.name}</span>
                  ))}
                  {book.Tags.length > 2 && (
                    <span className="card-tag-more">+{book.Tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
            {isBorrowed && (
              <span className="badge-borrowed" title="Emprestado">
                <span className="material-symbols-rounded">schedule</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  // Encontra o objeto do Gênero ativo para extrair os Subgêneros
  const activeGenreObj = availableGenres.find(g => g.name === selectedGenre);

  return (
    <div className="dashboard-container">
      {/* ... MANTÉM IGUAL O HEADER E A GAVETA DE FILTROS ... */}
      <header className="dash-header">
        <div className="brand-container">
          <img src={miniLogo} alt="vioLib" className="brand-logo" />
          <h1 className="brand-title">{t('library')}</h1>
        </div>
        
        <div className="user-actions-container">
          <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span className="material-symbols-rounded">{isMenuOpen ? 'close' : 'more_vert'}</span>
          </button>

          <div className={`header-actions ${isMenuOpen ? 'open' : ''}`}>
            <button onClick={() => { navigate('/configuracoes'); setIsMenuOpen(false); }} className="btn-action">
              <span className="material-symbols-rounded">settings</span> <span className="action-label">Ajustes</span>
            </button>
            <button onClick={() => { handleShare(); setIsMenuOpen(false); }} className="btn-action">
              <span className="material-symbols-rounded">group_add</span> <span className="action-label">Convidar</span>
            </button>
            <button onClick={() => { navigate('/novo-livro'); setIsMenuOpen(false); }} className="btn-action btn-primary">
              <span className="material-symbols-rounded">library_add</span> <span className="action-label">Novo</span>
            </button>
            <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="btn-action btn-logout">
              <span className="material-symbols-rounded">logout</span> <span className="action-label">Sair</span>
            </button>
          </div>
        </div>
      </header>

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

      {isFilterDrawerOpen && (
        <>
          <div className="filter-drawer-backdrop" onClick={() => setIsFilterDrawerOpen(false)}></div>
          <div className="filter-drawer-container">
            <div className="filter-drawer-header">
              <h3><span className="material-symbols-rounded">tune</span> Refinamento</h3>
              <button className="close-drawer-btn" onClick={() => setIsFilterDrawerOpen(false)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="filter-drawer-grid">
              <div className="filter-field-group">
                <label className="form-label"><span className="material-symbols-rounded">sort</span> Ordenar por</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select" style={{ flex: 1 }}>
                    <option value="title">Título</option>
                    <option value="author">Autor Principal</option>
                    <option value="releaseYear">Ano de Lançamento</option>
                  </select>
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="form-select">
                    <option value="ASC">Crescente</option>
                    <option value="DESC">Decrescente</option>
                  </select>
                </div>
              </div>

              <div className="filter-field-group">
                <label className="form-label"><span className="material-symbols-rounded">style</span> Filtrar por Tag</label>
                <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="form-select">
                  <option value="">Todas as Tags</option>
                  {availableTags.map(t => (
                    <option key={t.id} value={t.name}>#{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-field-group full-width toggles-row">
                <label className="checkbox-toggle-label">
                  <input type="checkbox" checked={showOnlyBorrowed} onChange={(e) => setShowOnlyBorrowed(e.target.checked)} />
                  <span>Apenas Emprestados</span>
                </label>
                <label className="checkbox-toggle-label">
                  <input type="checkbox" checked={showTagsOnCards} onChange={(e) => setShowTagsOnCards(e.target.checked)} />
                  <span>Exibir etiquetas (#tags)</span>
                </label>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- PRATELEIRAS VIRTUAIS PRINCIPAIS (GÊNEROS) --- */}
      <div className="shelf-wrapper">
        <button className="shelf-nav-btn left" onClick={() => scrollShelf(shelfRef, 'left')}>
          <span className="material-symbols-rounded">chevron_left</span>
        </button>

        <div 
          className="virtual-shelves-container"
          ref={shelfRef}
          onMouseDown={(e) => handleMouseDown(e, shelfRef)}
          onMouseLeave={() => handleMouseLeaveOrUp(shelfRef)}
          onMouseUp={() => handleMouseLeaveOrUp(shelfRef)}
          onMouseMove={(e) => handleMouseMove(e, shelfRef)}
        >
          <button 
            className={`shelf-pill ${selectedGenre === '' ? 'active' : ''}`}
            onClick={() => setSelectedGenre('')}
          >
            Toda a Biblioteca
          </button>
          {availableGenres.map(g => (
            <button 
              key={g.id} 
              className={`shelf-pill ${selectedGenre === g.name ? 'active' : ''}`}
              onClick={() => setSelectedGenre(g.name)}
            >
              {g.name}
            </button>
          ))}
        </div>

        <button className="shelf-nav-btn right" onClick={() => scrollShelf(shelfRef, 'right')}>
          <span className="material-symbols-rounded">chevron_right</span>
        </button>
      </div>

      {/* --- SUB-PRATELEIRAS (SUBGÊNEROS) --- */}
      {activeGenreObj && activeGenreObj.Subgenres?.length > 0 && (
        <div className="shelf-wrapper subgenre-wrapper">
          <button className="shelf-nav-btn left sub-nav" onClick={() => scrollShelf(subShelfRef, 'left')}>
            <span className="material-symbols-rounded">chevron_left</span>
          </button>

          <div 
            className="virtual-shelves-container subgenre-shelves"
            ref={subShelfRef}
            onMouseDown={(e) => handleMouseDown(e, subShelfRef)}
            onMouseLeave={() => handleMouseLeaveOrUp(subShelfRef)}
            onMouseUp={() => handleMouseLeaveOrUp(subShelfRef)}
            onMouseMove={(e) => handleMouseMove(e, subShelfRef)}
          >
            <button 
              className={`shelf-pill sub-pill ${selectedSubgenre === '' ? 'active' : ''}`}
              onClick={() => setSelectedSubgenre('')}
            >
              Todos em {activeGenreObj.name}
            </button>
            {activeGenreObj.Subgenres.map(sub => (
              <button 
                key={sub.id} 
                className={`shelf-pill sub-pill ${selectedSubgenre === sub.name ? 'active' : ''}`}
                onClick={() => setSelectedSubgenre(sub.name)}
              >
                {sub.name}
              </button>
            ))}
          </div>

          <button className="shelf-nav-btn right sub-nav" onClick={() => scrollShelf(subShelfRef, 'right')}>
            <span className="material-symbols-rounded">chevron_right</span>
          </button>
        </div>
      )}

      {/* ÁREA DA BIBLIOTECA */}
      <div className="library-section">
        <div className="section-header">
          <span className="material-symbols-rounded section-icon">
            {selectedSubgenre || selectedGenre ? 'folder_open' : 'local_library'}
          </span>
          <h2 className="section-title">
            {selectedSubgenre ? selectedSubgenre : (selectedGenre ? selectedGenre : 'Minha Biblioteca')}
            <span className="title-count">({totalBooks})</span>
          </h2>
        </div>
        
        {myBooks.length === 0 ? (
          <p className="empty-message">Nenhum livro encontrado nesta prateleira.</p>
        ) : (
          <BookGrid books={myBooks} />
        )}

        {hasMore && (
          <div className="pagination-trigger-zone">
            <button onClick={() => setPage(p => p + 1)} disabled={isLoading} className="btn-action btn-primary btn-load-more">
              {isLoading ? 'A sincronizar dados...' : 'Carregar mais obras'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;