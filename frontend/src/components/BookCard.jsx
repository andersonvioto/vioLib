import { useNavigate } from 'react-router-dom';
import { getCoverUrl } from '../utils/bookHelpers';
import './BookCard.css';

/**
 * Componente visual de um cartão de livro individual.
 * Suporta 3 Modos de Visualização: 'grid' (clássico), 'compact' (só capa/título menor) e 'list' (linha horizontal).
 *
 * @param {Object} props.book - Objeto contendo as informações do livro.
 * @param {boolean} props.showTags - Booleano indicando se as tags devem aparecer no cartão.
 * @param {string} props.viewMode - 'grid', 'compact' ou 'list'.
 */
const BookCard = ({ book, showTags, viewMode = 'grid' }) => {
  const navigate = useNavigate();

  const isBorrowed = book.Loans?.some((loan) => !loan.returnDate);
  const readingStatus = book.readingStatus || 'unread'; // Leitura do novo status

  const authorName = book.Authors?.length > 0 ? book.Authors[0].name : 'Autor Desconhecido';
  const releaseYear = book.releaseYear ? book.releaseYear : '';

  if (viewMode === 'list') {
    return (
      <div className="book-card-list-view" onClick={() => navigate(`/livro/${book.id}`)}>
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
              <span className="material-symbols-rounded">import_contacts</span> Lendo
            </span>
          )}
          {readingStatus === 'read' && (
            <span className="badge-read-list" title="Livro Lido">
              <span className="material-symbols-rounded">task_alt</span> Lido
            </span>
          )}
          {isBorrowed && (
            <span className="badge-borrowed-list" title="Emprestado">
              <span className="material-symbols-rounded">schedule</span> Emprestado
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`book-card ${viewMode === 'compact' ? 'is-compact' : ''}`}
      onClick={() => navigate(`/livro/${book.id}`)}
    >
      <div className="book-cover-wrapper">
        <div className="book-volume">
          <img src={getCoverUrl(book.coverImage)} alt={book.title} className="book-cover-img" />
          <div className="book-cover-overlay"></div>
          <div className="book-spine"></div>
          <div className="book-pages"></div>
          <div className="book-back"></div>
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

      {/* Contentor de Badges empilháveis */}
      <div className="book-card-badges">
        {isBorrowed && (
          <span className="badge-icon borrowed" title="Emprestado">
            <span className="material-symbols-rounded">schedule</span>
          </span>
        )}
        {readingStatus === 'reading' && (
          <span className="badge-icon reading" title="Lendo Atualmente">
            <span className="material-symbols-rounded">import_contacts</span>
          </span>
        )}
        {readingStatus === 'read' && (
          <span className="badge-icon read" title="Livro Lido">
            <span className="material-symbols-rounded">task_alt</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default BookCard;
