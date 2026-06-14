import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%232c2c2c" stroke="%23D4AF37" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  return `http://127.0.0.1:3000/files/${filename}`;
};

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [myBooks, setMyBooks] = useState([]);
  const [sharedLibraries, setSharedLibraries] = useState([]); // Guarda as bibliotecas dos amigos
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyBorrowed, setShowOnlyBorrowed] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. Busca os SEUS livros
        const myBooksRes = await api.get('/books');
        setMyBooks(myBooksRes.data);

        // 2. Busca de quem você tem acesso
        const accessRes = await api.get('/access/shared-with-me');
        const accesses = accessRes.data;

        // 3. Busca os livros de cada amigo
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

  // --- LÓGICA DE FILTROS REUTILIZÁVEL ---
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
  // Filtra os livros dos amigos e esconde a seção se ela ficar vazia pela pesquisa
  const filteredSharedLibs = sharedLibraries.map(lib => ({
    ownerName: lib.ownerName,
    books: applyFilters(lib.books)
  })).filter(lib => lib.books.length > 0); 

  // Componente interno para desenhar os cartões repetidos
  const BookGrid = ({ books, badgeColor }) => (
    <div style={styles.grid}>
      {books.map((book) => {
        const isBorrowed = book.Loans?.some(loan => !loan.returnDate);
        return (
          <div key={book.id} style={styles.card} onClick={() => navigate(`/livro/${book.id}`)}>
            <img src={getCoverUrl(book.coverImage)} alt={book.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
            <h3 style={{ margin: '0 0 10px 0' }}>{book.title}</h3>
            <p style={{ margin: 0, color: '#aaa', fontSize: '0.9em' }}>{book.Authors?.length > 0 ? book.Authors[0].name : 'Autor Desconhecido'}</p>
            {isBorrowed && <span style={{ ...styles.borrowedBadge, background: badgeColor || 'var(--accent-gold)' }}>Emprestado</span>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>{t('library')}</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleShare} style={{ ...styles.filterButton, background: 'transparent' }}>
            ✉️ Convidar Amigo
          </button>
          <button className="btn-primary" onClick={() => navigate('/novo-livro')}>
            + {t('add_book')}
          </button>
        </div>
      </header>

      {/* FILTROS GLOBAIS */}
      <div style={styles.filterSection}>
        <input type="text" placeholder="Pesquisar em todas as bibliotecas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
        <button onClick={() => setShowOnlyBorrowed(!showOnlyBorrowed)} style={{ ...styles.filterButton, background: showOnlyBorrowed ? 'var(--accent-gold)' : '#2c2c2c', color: showOnlyBorrowed ? '#000' : 'var(--text-primary)' }}>
          {showOnlyBorrowed ? '✓ Mostrando Emprestados' : 'Filtrar Emprestados'}
        </button>
      </div>

      {/* 1. SEÇÃO DA SUA BIBLIOTECA */}
      <div style={styles.sectionDivider}>
        <h2 style={styles.sectionTitle}>Minha Biblioteca</h2>
        {filteredMyBooks.length === 0 ? (
           <p style={{ color: '#888' }}>Nenhum livro encontrado na sua biblioteca.</p>
        ) : (
           <BookGrid books={filteredMyBooks} badgeColor="var(--accent-gold)" />
        )}
      </div>

      {/* 2. SEÇÕES DAS BIBLIOTECAS DOS AMIGOS */}
      {filteredSharedLibs.map((lib, index) => (
        <div key={index} style={styles.sectionDivider}>
          <h2 style={{ ...styles.sectionTitle, color: '#aaa', borderBottomColor: '#555' }}>
            Biblioteca de {lib.ownerName}
          </h2>
          <BookGrid books={lib.books} badgeColor="#aaa" />
        </div>
      ))}
    </div>
  );
};

// ESTILOS ATUALIZADOS
const styles = {
  container: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' },
  filterSection: { display: 'flex', gap: '15px', marginBottom: '40px', flexWrap: 'wrap' },
  searchInput: { flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#2c2c2c', color: 'white', minWidth: '250px' },
  filterButton: { padding: '12px 20px', borderRadius: '4px', border: '1px solid var(--accent-gold)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' },
  sectionDivider: { marginBottom: '50px' },
  sectionTitle: { fontSize: '1.8em', color: 'var(--accent-gold)', borderBottom: '2px solid var(--accent-gold)', paddingBottom: '10px', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' },
  card: { background: 'var(--surface-color)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--accent-gold)', cursor: 'pointer', position: 'relative' },
  borrowedBadge: { position: 'absolute', top: '10px', right: '10px', color: '#000', fontSize: '0.7em', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }
};

export default Dashboard;