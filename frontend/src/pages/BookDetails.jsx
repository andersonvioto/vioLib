import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './book-details.css';

// 1. CAPA GENÉRICA (SVG) - Caso o livro não tenha imagem de capa
const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%232c2c2c" stroke="%23D4AF37" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

// 2. FUNÇÃO AUXILIAR PRONTA PARA PRODUÇÃO
const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  // Lê a URL do servidor dinamicamente (Local ou Nuvem)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
  return `${apiUrl.replace('/api', '/files')}/${filename}`;
};

const BookDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  
  const [borrowerName, setBorrowerName] = useState('');
  const [loanDate, setLoanDate] = useState('');

  // Busca os detalhes da obra na API
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

  // Função para excluir a obra
  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir "${book.title}" da sua biblioteca?`)) {
      try {
        await api.delete(`/books/${id}`);
        navigate('/biblioteca');
      } catch (error) {
        alert('Erro ao excluir o livro.');
      }
    }
  };

  // Função para registrar um empréstimo
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

  // Função para registrar a devolução
  const handleReturn = async (loanId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.put(`/loans/${loanId}/return`, { returnDate: today });
      fetchBookDetails(); 
    } catch (error) {
      alert('Erro ao registrar devolução.');
    }
  };

  if (!book) return <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Carregando detalhes da obra...</div>;

  const activeLoan = book.Loans?.find(loan => !loan.returnDate);

  return (
    <div className="details-container">
      
      {/* CABEÇALHO COM AÇÕES */}
      <div className="details-header">
        <button onClick={() => navigate(-1)} className="btn-action" style={{ border: 'none' }}>
          <span className="material-symbols-rounded">arrow_back</span>
          Voltar
        </button>
        
        {/* SÓ MOSTRA OS BOTÕES DE EDIÇÃO/EXCLUSÃO SE FOR O DONO */}
        {book.isOwner && (
          <div className="header-actions">
            <button onClick={() => navigate(`/editar-livro/${id}`)} className="btn-action" style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>
              <span className="material-symbols-rounded">edit</span>
              Editar Obra
            </button>
            <button onClick={handleDelete} className="btn-action" style={{ color: 'var(--text-danger)', borderColor: 'var(--text-danger)' }}>
              <span className="material-symbols-rounded">delete</span>
              Excluir
            </button>
          </div>
        )}
      </div>
      
      {/* LAYOUT EDITORIAL (CAPA + INFORMAÇÕES) */}
      <div className="editorial-layout">
        
        {/* COLUNA ESQUERDA: CAPA */}
        <div className="cover-wrapper">
          <img src={getCoverUrl(book.coverImage)} alt={book.title} className="details-cover" />
        </div>

        {/* COLUNA DIREITA: INFORMAÇÕES */}
        <div className="details-content">
          
          <div>
            <h1 className="book-main-title">{book.title}</h1>
            <p className="book-main-authors">
              {book.Authors?.map(a => a.name).join(', ') || 'Autor Desconhecido'}
            </p>
          </div>

          {/* SÓ MOSTRA O PAINEL DE EMPRÉSTIMOS SE FOR O DONO */}
          {book.isOwner && (
            <div className="loan-module">
              <h3 className="loan-title">
                <span className="material-symbols-rounded">handshake</span> 
                Controle de Empréstimo
              </h3>
              
              {activeLoan ? (
                <div className="active-loan-info">
                  <p>📖 Atualmente emprestado para: <strong style={{ color: 'var(--accent-gold)' }}>{activeLoan.borrowerName}</strong></p>
                  <p>Data do empréstimo: {new Date(activeLoan.loanDate).toLocaleDateString('pt-BR')}</p>
                  <button onClick={() => handleReturn(activeLoan.id)} className="btn-action" style={{ marginTop: '15px', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>
                    <span className="material-symbols-rounded">assignment_return</span>
                    Marcar como Devolvido
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLoanSubmit} className="loan-form">
                  <input 
                    placeholder="Nome da pessoa" required value={borrowerName} 
                    onChange={(e) => setBorrowerName(e.target.value)} 
                    className="form-input" style={{ flex: 1, minWidth: '200px' }}
                  />
                  <input 
                    type="date" required value={loanDate} 
                    onChange={(e) => setLoanDate(e.target.value)} 
                    className="form-input" 
                  />
                  <button type="submit" className="btn-action btn-primary">
                    Emprestar
                  </button>
                </form>
              )}
            </div>
          )}

          {/* METADADOS EDITORIAIS */}
          <div className="meta-grid">
            <div className="meta-item">
              <span className="meta-label">Gênero</span>
              <span className="meta-value">{book.Genres?.map(g => g.name).join(', ') || '—'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Subgêneros</span>
              <span className="meta-value">{book.Subgenres?.map(s => s.name).join(', ') || '—'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Ano</span>
              <span className="meta-value">{book.releaseYear || '—'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Editora</span>
              <span className="meta-value">{book.publisher || '—'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Edição</span>
              <span className="meta-value">{book.edition || '—'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Tradutores</span>
              <span className="meta-value">{book.Translators?.map(t => t.name).join(', ') || '—'}</span>
            </div>
            <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
              <span className="meta-label">Tags</span>
              <span className="meta-value">
                {book.Tags?.length > 0 ? book.Tags.map(t => t.name).join(', ') : '—'}
              </span>
            </div>
          </div>

          {/* NOTAS PESSOAIS */}
          {book.notes && (
            <div className="notes-module">
              <h3 className="loan-title" style={{ fontSize: '1em', color: 'var(--text-primary)' }}>
                <span className="material-symbols-rounded">edit_note</span> Notas Pessoais
              </h3>
              <p className="notes-text">{book.notes}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BookDetails;