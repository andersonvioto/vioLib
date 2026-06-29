import { useNavigate } from 'react-router-dom';
import { getCoverUrl } from '../utils/bookHelpers';
import './BookCard.css';

/**
 * Componente visual de um cartão de livro individual.
 * @param {Object} props.book - Objeto contendo as informações do livro.
 * @param {boolean} props.showTags - Booleano indicando se as tags devem aparecer no cartão.
 */
const BookCard = ({ book, showTags }) => {
  const navigate = useNavigate();

  const isBorrowed = book.Loans?.some(loan => !loan.returnDate);
  const authorName = book.Authors?.length > 0 ? book.Authors[0].name : 'Autor Desconhecido';

  return (
    <div className="book-card" onClick={() => navigate(`/livro/${book.id}`)}>
      
      {/* O Palco 3D (Perspectiva) */}
      <div className="book-cover-wrapper">
        
        {/* O Bloco 3D que engloba todas as faces e que irá rodar no Hover */}
        <div className="book-volume">
          
          {/* Face 1: Capa Frontal */}
          <img src={getCoverUrl(book.coverImage)} alt={book.title} className="book-cover-img" />
          
          {/* Face 2: Verniz e Vinco sobre a capa */}
          <div className="book-cover-overlay"></div>
          
          {/* Face 3: Páginas (Lateral Direita) */}
          <div className="book-pages"></div>
          
          {/* Face 4: Contra-capa (Fundo) */}
          <div className="book-back"></div>
          
        </div>

      </div>
      
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{authorName}</p>
        
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
      
      {isBorrowed && (
        <span className="badge-borrowed" title="Emprestado">
          <span className="material-symbols-rounded">schedule</span>
        </span>
      )}
    </div>
  );
};

export default BookCard;