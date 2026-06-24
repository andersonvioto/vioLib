import { useNavigate } from 'react-router-dom';
import { getCoverUrl } from '../utils/bookHelpers';

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
      <img src={getCoverUrl(book.coverImage)} alt={book.title} className="book-cover" />
      
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