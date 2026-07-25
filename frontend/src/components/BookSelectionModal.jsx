import { getCoverUrl } from '../utils/bookHelpers';
import './BookSelectionModal.css';

/**
 * Modal para exibição dos resultados da Busca Híbrida em Cascata.
 * Permite ao usuário escolher visualmente a edição exata do livro.
 */
const BookSelectionModal = ({ isOpen, onClose, results, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="selection-modal-overlay" onClick={onClose}>
      <div className="selection-modal-box" onClick={(e) => e.stopPropagation()}>
        <header className="selection-modal-header">
          <h2 className="selection-modal-title">
            <span className="material-symbols-rounded" aria-hidden="true">
              library_books
            </span>
            Resultados Encontrados
          </h2>
          <button className="selection-modal-close" onClick={onClose} title="Fechar">
            <span className="material-symbols-rounded" aria-hidden="true">
              close
            </span>
          </button>
        </header>

        <div className="selection-modal-content">
          <p className="selection-modal-subtitle">
            Encontramos as seguintes edições na nossa base global e em bibliotecas externas. Clique
            na capa que corresponde ao seu livro para preencher os dados automaticamente.
          </p>

          {results.length === 0 ? (
            <div className="selection-empty-state">
              <span className="material-symbols-rounded empty-icon" aria-hidden="true">
                search_off
              </span>
              <p>Nenhuma edição encontrada com este termo.</p>
            </div>
          ) : (
            <div className="selection-results-grid">
              {results.map((book, index) => (
                <div
                  key={index}
                  className="selection-book-card"
                  onClick={() => onSelect(book)}
                  role="button"
                  tabIndex="0"
                  aria-label={`Selecionar ${book.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(book);
                    }
                  }}
                >
                  <div className="selection-cover-wrapper">
                    <img
                      src={book.coverImage || getCoverUrl('')}
                      alt={`Capa de ${book.title}`}
                      className="selection-cover-img"
                    />
                  </div>
                  <div className="selection-book-info">
                    <h3 className="selection-book-title" title={book.title}>
                      {book.title}
                    </h3>
                    <p className="selection-book-author" title={book.authors?.join(', ')}>
                      {book.authors?.join(', ') || 'Autor Desconhecido'}
                    </p>
                    <div className="selection-book-meta">
                      {book.publisher && <span>{book.publisher}</span>}
                      {book.releaseYear && <span>{book.releaseYear}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookSelectionModal;
