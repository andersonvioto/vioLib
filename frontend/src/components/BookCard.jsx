import { useNavigate } from 'react-router-dom';
import { getCoverUrl } from '../utils/bookHelpers';
import './BookCard.css';

/**
 * Componente visual de cartão bibliográfico com suporte a 3 Modos de Visualização.
 * No modo 'grid' com atributo global [data-cover-style="book"], renderiza um sólido 3D de 6 faces
 * hiper-realista com oclusão óptica e beiral de capa dura.
 */
const BookCard = ({ book, showTags, viewMode = 'grid' }) => {
  const navigate = useNavigate();

  const isBorrowed = book.Loans?.some((loan) => !loan.returnDate);
  const readingStatus = book.readingStatus || 'unread';

  const authorName = book.Authors?.length > 0 ? book.Authors[0].name : 'Autor Desconhecido';
  const releaseYear = book.releaseYear ? book.releaseYear : '';

  const handleCardClick = () => {
    navigate(`/livro/${book.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        className="book-card-list-view"
        onClick={handleCardClick}
        role="button"
        tabIndex="0"
        onKeyDown={handleKeyDown}
        aria-label={`Ver detalhes de ${book.title}, por ${authorName}`}
      >
        <img src={getCoverUrl(book.coverImage)} alt={book.title} className="list-cover-img" />

        <div className="list-main-info">
          <h3 className="list-book-title">{book.title}</h3>
          <p className="list-book-author">{authorName}</p>

          <div className="list-meta-details">
            {book.publisher && <span className="list-meta-item">{book.publisher}</span>}
            {releaseYear && <span className="list-meta-item">{releaseYear}</span>}
          </div>
        </div>

        <div className="list-tags-container">
          {showTags &&
            book.Tags?.slice(0, 3).map((tag) => (
              <span key={tag.id} className="list-tag-chip">
                #{tag.name}
              </span>
            ))}
        </div>

        <div className="list-status">
          {readingStatus === 'reading' && (
            <span className="badge-reading-list" title="Lendo Atualmente">
              <span className="material-symbols-rounded" aria-hidden="true">
                import_contacts
              </span>
              <span>Lendo</span>
            </span>
          )}
          {readingStatus === 'read' && (
            <span className="badge-read-list" title="Lido">
              <span className="material-symbols-rounded" aria-hidden="true">
                task_alt
              </span>
              <span>Lido</span>
            </span>
          )}
          {isBorrowed && (
            <span className="badge-borrowed-list" title="Emprestado">
              <span className="material-symbols-rounded" aria-hidden="true">
                schedule
              </span>
              <span>Emprestado</span>
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`book-card ${viewMode === 'compact' ? 'is-compact' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex="0"
      onKeyDown={handleKeyDown}
      aria-label={`Ver detalhes do livro ${book.title}`}
    >
      <div className="book-cover-wrapper">
        <div className="book-volume">
          <img src={getCoverUrl(book.coverImage)} alt={book.title} className="book-cover-img" />
          <div className="book-cover-overlay" aria-hidden="true"></div>
          <div className="book-spine" aria-hidden="true"></div>
          <div className="book-pages" aria-hidden="true"></div>
          <div className="book-pages-top" aria-hidden="true"></div>
          <div className="book-pages-bottom" aria-hidden="true"></div>
          <div className="book-back" aria-hidden="true"></div>
        </div>
      </div>

      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{authorName}</p>

        {showTags && viewMode !== 'compact' && book.Tags?.length > 0 && (
          <div className="card-tags-container">
            {book.Tags.slice(0, 2).map((tag) => (
              <span key={tag.id} className="card-tag-chip">
                #{tag.name}
              </span>
            ))}
            {book.Tags.length > 2 && <span className="card-tag-more">+{book.Tags.length - 2}</span>}
          </div>
        )}
      </div>

      <div className="book-card-badges" aria-label="Status do livro">
        {isBorrowed && (
          <span className="badge-icon borrowed" title="Emprestado">
            <span className="material-symbols-rounded" aria-hidden="true">
              schedule
            </span>
          </span>
        )}
        {readingStatus === 'reading' && (
          <span className="badge-icon reading" title="Lendo Atualmente">
            <span className="material-symbols-rounded" aria-hidden="true">
              import_contacts
            </span>
          </span>
        )}
        {readingStatus === 'read' && (
          <span className="badge-icon read" title="Lido">
            <span className="material-symbols-rounded" aria-hidden="true">
              task_alt
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

export default BookCard;
