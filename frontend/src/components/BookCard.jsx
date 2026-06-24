import { useNavigate } from 'react-router-dom';

const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%232c2c2c" stroke="%23D4AF37" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

/**
 * Utilitário para formatar a URL da capa do livro.
 */
const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  if (filename.startsWith('http')) return filename; 
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
  return `${apiUrl.replace('/api', '/files')}/${filename}`;
};

/**
 * Componente visual de um cartão de livro individual.
 * * @param {Object} props.book - Objeto contendo as informações do livro.
 * @param {boolean} props.showTags - Booleano indicando se as tags devem aparecer no cartão.
 */
const BookCard = ({ book, showTags }) => {
  const navigate = useNavigate();

  // Verifica se o livro possui algum empréstimo ativo (sem data de devolução)
  const isBorrowed = book.Loans?.some(loan => !loan.returnDate);
  const authorName = book.Authors?.length > 0 ? book.Authors[0].name : 'Autor Desconhecido';

  return (
    <div className="book-card" onClick={() => navigate(`/livro/${book.id}`)}>
      <img 
        src={getCoverUrl(book.coverImage)} 
        alt={book.title} 
        className="book-cover" 
      />
      
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{authorName}</p>
        
        {/* Renderização Condicional das Tags */}
        {showTags && book.Tags?.length > 0 && (
          <div className="card-tags-container">
            {book.Tags.slice(0, 2).map(tag => (
              <span key={tag.id} className="card-tag-chip">
                #{tag.name}
              </span>
            ))}
            
            {book.Tags.length > 2 && (
              <span className="card-tag-more">
                +{book.Tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Badge de Empréstimo */}
      {isBorrowed && (
        <span className="badge-borrowed" title="Emprestado">
          <span className="material-symbols-rounded">schedule</span>
        </span>
      )}
    </div>
  );
};

export default BookCard;