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
  const authorName = book.Authors?.length > 0 ? book.Authors[0].name : 'Autor Desconhecido';
  const releaseYear = book.releaseYear ? book.releaseYear : '';

  // === RENDERIZAÇÃO MODO LISTA ===
  // O modo lista possui um layout DOM horizontal totalmente diferente para atuar como uma tabela elegante.
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
          {isBorrowed && (
            <span className="badge-borrowed-list" title="Emprestado">
              <span className="material-symbols-rounded">schedule</span> Emprestado
            </span>
          )}
        </div>
      </div>
    );
  }

  // === RENDERIZAÇÃO MODOS GRID E COMPACT ===
  // O modo 'compact' usa a mesma estrutura DOM do 'grid', mas omite tags e o CSS ajusta os tamanhos.
  return (
    <div
      className={`book-card ${viewMode === 'compact' ? 'is-compact' : ''}`}
      onClick={() => navigate(`/livro/${book.id}`)}
    >
      {/* O Palco 3D (Perspectiva) */}
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

        {/* No modo compacto, omitimos as tags para poupar espaço */}
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

      {isBorrowed && (
        <span className="badge-borrowed" title="Emprestado">
          <span className="material-symbols-rounded">schedule</span>
        </span>
      )}
    </div>
  );
};

export default BookCard;
