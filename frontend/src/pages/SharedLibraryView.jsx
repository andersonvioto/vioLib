import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%232c2c2c" stroke="%23D4AF37" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  return `http://127.0.0.1:3000/files/${filename}`;
};

const SharedLibraryView = () => {
  const { ownerId } = useParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await api.get(`/access/${ownerId}/books`);
        setBooks(response.data);
      } catch (error) {
        alert('Erro ao carregar a biblioteca ou acesso negado.');
        navigate('/bibliotecas-compartilhadas');
      }
    };
    fetchBooks();
  }, [ownerId, navigate]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Acervo Compartilhado</h1>
        <button onClick={() => navigate('/bibliotecas-compartilhadas')} style={styles.btnBack}>
          &larr; Voltar
        </button>
      </header>

      {books.length === 0 ? (
        <div style={styles.emptyState}><p>Esta biblioteca está vazia.</p></div>
      ) : (
        <div style={styles.grid}>
          {books.map((book) => {
            const isBorrowed = book.Loans?.some(loan => !loan.returnDate);
            return (
              <div key={book.id} style={styles.card}>
                <img src={getCoverUrl(book.coverImage)} alt={book.title} style={styles.cover} />
                <h3 style={{ margin: '0 0 5px 0' }}>{book.title}</h3>
                <p style={{ margin: 0, color: '#aaa', fontSize: '0.9em' }}>
                  {book.Authors?.length > 0 ? book.Authors[0].name : 'Autor Desconhecido'}
                </p>
                {isBorrowed && <span style={styles.borrowedBadge}>Emprestado</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--accent-gold)', paddingBottom: '20px' },
  btnBack: { background: 'none', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  emptyState: { textAlign: 'center', marginTop: '50px', color: '#888', fontStyle: 'italic' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' },
  card: { background: 'var(--surface-color)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #555', position: 'relative' },
  cover: { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' },
  borrowedBadge: { position: 'absolute', top: '10px', right: '10px', background: '#444', color: '#fff', fontSize: '0.7em', padding: '3px 8px', borderRadius: '12px' }
};

export default SharedLibraryView;