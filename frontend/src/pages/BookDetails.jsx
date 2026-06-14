import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

// 1. CAPA GENÉRICA (SVG) - Caso o livro não tenha imagem de capa
const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%232c2c2c" stroke="%23D4AF37" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

// 2. FUNÇÃO AUXILIAR - Monta a URL da imagem apontando para o seu back-end
const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  return `http://127.0.0.1:3000/files/${filename}`;
};

const BookDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  
  const [borrowerName, setBorrowerName] = useState('');
  const [loanDate, setLoanDate] = useState('');

  const fetchBookDetails = async () => {
    try {
      const response = await api.get(`/books/${id}`);
      setBook(response.data);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      alert('Livro não encontrado ou sem permissão de acesso.');
      navigate('/biblioteca');
    }
  };

  useEffect(() => {
    fetchBookDetails();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir "${book.title}"?`)) {
      try {
        await api.delete(`/books/${id}`);
        navigate('/biblioteca');
      } catch (error) {
        alert('Erro ao excluir o livro.');
      }
    }
  };

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/loans', { borrowerName, loanDate, BookId: id });
      setBorrowerName('');
      setLoanDate('');
      fetchBookDetails(); 
    } catch (error) {
      alert('Erro ao registrar empréstimo.');
    }
  };

  const handleReturn = async (loanId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.put(`/loans/${loanId}/return`, { returnDate: today });
      fetchBookDetails(); 
    } catch (error) {
      alert('Erro ao registrar devolução.');
    }
  };

  if (!book) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando detalhes...</div>;

  const activeLoan = book.Loans?.find(loan => !loan.returnDate);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.btnBack}>
          &larr; Voltar
        </button>
        
        {/* SÓ MOSTRA OS BOTÕES DE EDIÇÃO/EXCLUSÃO SE FOR O DONO */}
        {book.isOwner && (
          <div>
            <button onClick={() => navigate(`/editar-livro/${id}`)} style={{ ...styles.btnDanger, background: 'var(--accent-gold)', color: 'black', marginRight: '10px' }}>
              Editar Livro
            </button>
            <button onClick={handleDelete} style={styles.btnDanger}>Excluir Livro</button>
          </div>
        )}
      </div>
      
      <div style={styles.card}>
        <div style={styles.bookMainInfo}>
          <img src={getCoverUrl(book.coverImage)} alt={book.title} style={styles.coverImageStyle} />
          <div style={styles.titleContainer}>
            <h1 style={styles.title}>{book.title}</h1>
            <p style={styles.subtitle}>{book.Authors?.map(a => a.name).join(', ') || 'Autor Desconhecido'}</p>
          </div>
        </div>

        {/* SÓ MOSTRA O PAINEL DE EMPRÉSTIMOS SE FOR O DONO */}
        {book.isOwner && (
          <div style={styles.loanSection}>
            <h3 style={{ color: 'var(--accent-gold)', marginTop: 0 }}>Controle de Empréstimo</h3>
            {activeLoan ? (
              <div style={styles.activeLoan}>
                <p>📖 Atualmente emprestado para: <strong>{activeLoan.borrowerName}</strong></p>
                <p>Data do empréstimo: {new Date(activeLoan.loanDate).toLocaleDateString('pt-BR')}</p>
                <button onClick={() => handleReturn(activeLoan.id)} style={styles.btnReturn}>
                  Marcar como Devolvido
                </button>
              </div>
            ) : (
              <form onSubmit={handleLoanSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input placeholder="Nome da pessoa" required value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} style={styles.input} />
                <input type="date" required value={loanDate} onChange={(e) => setLoanDate(e.target.value)} style={styles.input} />
                <button type="submit" className="btn-primary" style={{ padding: '10px 15px' }}>Emprestar</button>
              </form>
            )}
          </div>
        )}

        <div style={styles.grid}>
          <div><strong>Gênero:</strong> {book.Genres?.map(g => g.name).join(', ') || '-'}</div>
          <div><strong>Subgêneros:</strong> {book.Subgenres?.map(s => s.name).join(', ') || '-'}</div>
          <div><strong>Ano:</strong> {book.releaseYear || '-'}</div>
          <div><strong>Editora:</strong> {book.publisher || '-'}</div>
          <div><strong>Edição:</strong> {book.edition || '-'}</div>
          <div><strong>Tradutores:</strong> {book.Translators?.map(t => t.name).join(', ') || '-'}</div>
          <div><strong>Tags:</strong> {book.Tags?.map(t => t.name).join(', ') || '-'}</div>
        </div>

        {book.notes && (
          <div style={styles.notes}>
            <strong>Notas Pessoais:</strong>
            <p style={{ marginTop: '10px', lineHeight: '1.5' }}>{book.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};


// ESTILOS ATUALIZADOS
const styles = {
  container: { padding: '40px', maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  btnBack: { background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '16px' },
  btnDanger: { background: '#d32f2f', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  card: { background: 'var(--surface-color)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--accent-gold)' },
  
  // Estilos da nova estrutura da capa e título
  bookMainInfo: { display: 'flex', gap: '30px', marginBottom: '30px', alignItems: 'flex-start', flexWrap: 'wrap' },
  coverImageStyle: { width: '150px', height: '225px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #444', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },
  titleContainer: { flex: 1, minWidth: '250px' },

  title: { color: 'var(--accent-gold)', margin: '0 0 10px 0', fontSize: '2.5em' },
  subtitle: { fontSize: '1.2em', color: '#aaa', margin: 0, fontStyle: 'italic' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px', borderTop: '1px solid #333', paddingTop: '20px' },
  notes: { marginTop: '20px', padding: '20px', background: '#2c2c2c', borderRadius: '4px', borderLeft: '3px solid var(--accent-gold)' },
  loanSection: { background: '#1a1a1a', padding: '20px', borderRadius: '6px', marginBottom: '30px', border: '1px solid #333' },
  activeLoan: { background: '#2b220b', padding: '15px', borderRadius: '4px', borderLeft: '4px solid var(--accent-gold)' },
  btnReturn: { background: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#2c2c2c', color: 'white' }
};

export default BookDetails;