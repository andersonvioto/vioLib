import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './book-details.css';

/**
 * Fallback em formato SVG utilizado quando o livro não possui uma imagem de capa definida.
 */
const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%232c2c2c" stroke="%23D4AF37" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

/**
 * Resolve a URL final da imagem de capa, tratando links externos e locais.
 */
const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  if (filename.startsWith('http')) return filename; 
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
  const fileBaseUrl = apiUrl.replace('/api', '/files');
  return `${fileBaseUrl}/${filename}`;
};

/**
 * Converte string 'YYYY-MM-DD' para 'DD/MM/YYYY' isolando o fuso horário local.
 */
const formatDateSafe = (dateString) => {
  if (!dateString) return '';
  // Divide a string e a inverte. Resolve 100% dos bugs de fuso horário do navegador.
  return dateString.split('-').reverse().join('/');
};

const BookDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [book, setBook] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [loanDate, setLoanDate] = useState('');
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCitationMenu, setShowCitationMenu] = useState(false);

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
    if (window.confirm(`Tem certeza que deseja excluir "${book.title}" da sua biblioteca?`)) {
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
      // Adquirimos a data local correta sem sofrer influência de UTC
      const d = new Date();
      const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      await api.put(`/loans/${loanId}/return`, { returnDate: localToday });
      fetchBookDetails(); 
    } catch (error) {
      alert('Erro ao registrar devolução.');
    }
  };

  const getCitationText = (format) => {
    const formatAuthorABNT = (fullName) => {
      if (!fullName) return 'AUTOR DESCONHECIDO';
      const parts = fullName.trim().split(' ');
      if (parts.length <= 1) return fullName.toUpperCase();
      
      const lastName = parts[parts.length - 1];
      const firstNames = parts.slice(0, -1).join(' ');
      return `${lastName.toUpperCase()}, ${firstNames}`;
    };

    const authorFull = book.Authors?.length > 0 ? book.Authors[0].name : '';
    const title = book.title;
    const year = book.releaseYear || '[s.d.]';
    const city = book.publicationLocation || '[S.l.]';
    const pub = book.publisher || '[s.n.]';
    const ed = book.edition ? `${book.edition}. ` : '';

    switch(format) {
      case 'ABNT': 
        return `${formatAuthorABNT(authorFull)}. ${title}. ${ed}${city}: ${pub}, ${year}.`;
      case 'APA': 
        return `${formatAuthorABNT(authorFull)} (${year}). ${title}. ${pub}.`;
      case 'Vancouver': 
        return `${authorFull.toUpperCase()}. ${title}. ${ed}${city}: ${pub}; ${year}.`;
      case 'Harvard': 
        return `${authorFull.toUpperCase()}, ${year}. ${title}. ${city}: ${pub}.`;
      default: return '';
    }
  };

  const handleCopyCitation = (format) => {
    const text = getCitationText(format);
    navigator.clipboard.writeText(text);
    alert(`Citação no formato ${format} copiada com sucesso!`);
    setShowCitationMenu(false); 
    setIsMenuOpen(false);
  };

  if (!book) return <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Carregando detalhes da obra...</div>;

  const activeLoan = book.Loans?.find(loan => !loan.returnDate);

  return (
    <div className="details-container">
      
      <div className="details-header">
        <button onClick={() => navigate('/biblioteca')} className="btn-action btn-back-clean">
          <span className="material-symbols-rounded">arrow_back</span>
          Voltar
        </button>
        
        <div className="owner-actions-container">
          
          {book.isOwner && (
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Opções da Obra"
            >
              <span className="material-symbols-rounded">
                {isMenuOpen ? 'close' : 'more_vert'}
              </span>
            </button>
          )}

          <div className={`header-actions ${isMenuOpen ? 'open' : ''}`}>
            
            <div className="citation-container-dropdown">
              <button 
                type="button" 
                className="btn-action citation-trigger-btn" 
                onClick={() => setShowCitationMenu(!showCitationMenu)}
              >
                <span className="material-symbols-rounded">format_quote</span>
                <span className="action-label">Gerar Citação</span>
                <span className="material-symbols-rounded arrow-icon">
                  {showCitationMenu ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showCitationMenu && (
                <div className="citation-dropdown-menu">
                  <button onClick={() => handleCopyCitation('ABNT')} className="citation-menu-item">
                    <span className="badge-format">ABNT</span> Copiar referência
                  </button>
                  <button onClick={() => handleCopyCitation('APA')} className="citation-menu-item">
                    <span className="badge-format">APA</span> Copiar referência
                  </button>
                  <button onClick={() => handleCopyCitation('Vancouver')} className="citation-menu-item">
                    <span className="badge-format">Vancouver</span> Copiar referência
                  </button>
                  <button onClick={() => handleCopyCitation('Harvard')} className="citation-menu-item">
                    <span className="badge-format">Harvard</span> Copiar referência
                  </button>
                </div>
              )}
            </div>

            {book.isOwner && (
              <>
                <button 
                  onClick={() => navigate(`/editar-livro/${id}`)} 
                  className="btn-action edit-btn"
                >
                  <span className="material-symbols-rounded">edit</span>
                  Editar Obra
                </button>
                
                <button 
                  onClick={handleDelete} 
                  className="btn-action delete-btn"
                >
                  <span className="material-symbols-rounded">delete</span>
                  Excluir
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="editorial-layout">
        
        <div className="cover-wrapper">
          <img src={getCoverUrl(book.coverImage)} alt={book.title} className="details-cover" />
        </div>

        <div className="details-content">
          <div>
            <h1 className="book-main-title">{book.title}</h1>
            <p className="book-main-authors">
              {book.Authors?.map(a => a.name).join(', ') || 'Autor Desconhecido'}
            </p>
          </div>

          {book.isOwner && (
            <div className="loan-module">
              <h3 className="loan-title">
                <span className="material-symbols-rounded">handshake</span> 
                Controle de Empréstimo
              </h3>
              
              {activeLoan ? (
                <div className="active-loan-info">
                  <p>📖 Atualmente emprestado para: <strong style={{ color: 'var(--accent-gold)' }}>{activeLoan.borrowerName}</strong></p>
                  
                  {/* CORREÇÃO DO FRONTEND APLICADA AQUI */}
                  <p>Data do empréstimo: {formatDateSafe(activeLoan.loanDate)}</p>
                  
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
              <span className="meta-label">ISBN</span>
              <span className="meta-value">{book.isbn || '—'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Local</span>
              <span className="meta-value">{book.publicationLocation || '—'}</span>
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