import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './dashboard.css'; 
import miniLogo from '../assets/violib-logo.png'; 

const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%232c2c2c" stroke="%23D4AF37" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
  const fileBaseUrl = apiUrl.replace('/api', '/files');
  return `${fileBaseUrl}/${filename}`;
};

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [myBooks, setMyBooks] = useState([]);
  const [sharedLibraries, setSharedLibraries] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyBorrowed, setShowOnlyBorrowed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const myBooksRes = await api.get('/books');
        setMyBooks(myBooksRes.data);

        const accessRes = await api.get('/access/shared-with-me');
        const accesses = accessRes.data;

        const friendsData = await Promise.all(accesses.map(async (acc) => {
          const booksRes = await api.get(`/access/${acc.ownerId}/books`);
          return { ownerName: acc.Owner.name, books: booksRes.data };
        }));
        setSharedLibraries(friendsData);

      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };
    fetchAllData();
  }, [navigate]);

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

  const applyFilters = (bookList) => {
    return bookList.filter((book) => {
      const isBorrowed = book.Loans?.some(loan => !loan.returnDate);
      const authorName = book.Authors?.length > 0 ? book.Authors[0].name.toLowerCase() : '';
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || authorName.includes(searchTerm.toLowerCase());
      if (showOnlyBorrowed && !isBorrowed) return false;
      return matchesSearch;
    });
  };

  const filteredMyBooks = applyFilters(myBooks);
  const filteredSharedLibs = sharedLibraries.map(lib => ({
    ownerName: lib.ownerName,
    books: applyFilters(lib.books)
  })).filter(lib => lib.books.length > 0);

  const totalBooks = myBooks.length;
  const borrowedBooksCount = myBooks.filter(book => book.Loans?.some(loan => !loan.returnDate)).length;
  const uniqueAuthors = new Set();
  myBooks.forEach(book => {
    if (book.Authors) book.Authors.forEach(author => uniqueAuthors.add(author.name));
  });
  const totalAuthors = uniqueAuthors.size;

  const BookGrid = ({ books, badgeColor, badgeText, badgeIcon }) => (
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
            </div>
            {isBorrowed && (
              <span className="badge-borrowed" style={{ background: badgeColor || 'var(--accent-gold)' }}>
                <span className="material-symbols-rounded">{badgeIcon || 'schedule'}</span>
                {badgeText || 'Emprestado'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="dashboard-container">
      <header className="dash-header">
        <div className="brand-container">
          <img src={miniLogo} alt="vioLib" className="brand-logo" />
          <h1 className="brand-title">{t('library')}</h1>
        </div>
        
        {/* NOVO CONTAINER PADRONIZADO (Idêntico ao Detalhe do Livro) */}
        <div className="user-actions-container">
          
          {/* BOTÃO 3 PONTINHOS (Aparece apenas no Mobile) */}
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Menu"
          >
            <span className="material-symbols-rounded">
              {isMenuOpen ? 'close' : 'more_vert'}
            </span>
          </button>

          {/* MENU: No Desktop fica alinhado no header. No Mobile vira Dropdown. */}
          <div className={`header-actions ${isMenuOpen ? 'open' : ''}`}>
            <button 
              onClick={() => { navigate('/configuracoes'); setIsMenuOpen(false); }} 
              className="btn-action" 
              title="Configurações da Conta"
            >
              <span className="material-symbols-rounded">settings</span>
              <span className="action-label">Ajustes</span>
            </button>
            
            <button 
              onClick={() => { handleShare(); setIsMenuOpen(false); }} 
              className="btn-action"
            >
              <span className="material-symbols-rounded">group_add</span>
              <span className="action-label">Convidar</span>
            </button>

            <button 
              onClick={() => { navigate('/novo-livro'); setIsMenuOpen(false); }} 
              className="btn-action btn-primary"
            >
              <span className="material-symbols-rounded">library_add</span>
              <span className="action-label">Novo</span>
            </button>

            <button 
              onClick={() => { handleLogout(); setIsMenuOpen(false); }} 
              className="btn-action btn-logout" 
              title="Sair do Sistema"
            >
              <span className="material-symbols-rounded">logout</span>
              <span className="action-label">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="stats-container">
        <div className="stat-widget">
          <span className="material-symbols-rounded stat-icon">menu_book</span>
          <div className="stat-info">
            <h3 className="stat-number">{totalBooks}</h3>
            <span className="stat-label">obras</span>
          </div>
        </div>
        
        <div className="stat-widget">
          <span className="material-symbols-rounded stat-icon">history_edu</span>
          <div className="stat-info">
            <h3 className="stat-number">{totalAuthors}</h3>
            <span className="stat-label">autores</span>
          </div>
        </div>
        
        <div className="stat-widget">
          <span className="material-symbols-rounded stat-icon">bookmark_added</span>
          <div className="stat-info">
            <h3 className="stat-number">{borrowedBooksCount}</h3>
            <span className="stat-label">emprestados</span>
          </div>
        </div>
      </div>

      <div className="filter-section">
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
          onClick={() => setShowOnlyBorrowed(!showOnlyBorrowed)} 
          className="btn-action"
          style={{ background: showOnlyBorrowed ? 'var(--accent-gold)' : 'transparent', color: showOnlyBorrowed ? '#000' : 'var(--text-primary)' }}
        >
          <span className="material-symbols-rounded">
            {showOnlyBorrowed ? 'filter_alt_off' : 'filter_list'}
          </span>
          <span className="action-label">{showOnlyBorrowed ? 'Todos' : 'Emprestados'}</span>
        </button>
      </div>

      <div className="library-section">
        <div className="section-header">
          <span className="material-symbols-rounded section-icon">local_library</span>
          <h2 className="section-title">Minha Biblioteca</h2>
        </div>
        
        {filteredMyBooks.length === 0 ? (
           <p style={{ color: 'var(--text-muted)' }}>Nenhum livro encontrado na sua biblioteca.</p>
        ) : (
           <BookGrid books={filteredMyBooks} />
        )}
      </div>

      {filteredSharedLibs.map((lib, index) => (
        <div key={index} className="library-section">
          <div className="section-header shared">
            <span className="material-symbols-rounded section-icon">share</span>
            <h2 className="section-title">Biblioteca de {lib.ownerName}</h2>
          </div>
          
          <BookGrid 
            books={lib.books} 
            badgeColor="#aaaaaa"
            badgeText="Emprestado" 
            badgeIcon="lock_clock"
          />
        </div>
      ))}
    </div>
  );
};

export default Dashboard;