import { formatDateSafe, formatISBN } from '../utils/bookHelpers';
import './BookMetadataGrid.css';

/**
 * Componente visual puramente apresentacional (Dumb Component).
 * Renderiza os metadados do livro aplicando princípios de hierarquia visual e tipografia.
 * Oculta automaticamente campos que não possuem valor (Divulgação Progressiva).
 * @param {Object} props.book - Objeto com os dados detalhados da obra.
 */
const BookMetadataGrid = ({ book }) => {
  /**
   * Helper interno para padronizar a renderização de cada bloco de metadado.
   * Evita a repetição de JSX, garante consistência visual e oculta o campo se for vazio.
   * @param {string} label - O rótulo do campo (ex: 'Editora').
   * @param {string|Number} value - O valor a ser exibido.
   * @param {boolean} [isFullWidth=false] - Força o item a ocupar toda a largura do Grid.
   */
  const renderMetaItem = (label, value, isFullWidth = false) => {
    // Regra de Negócio: Se o valor for null, undefined ou uma string vazia, não renderiza nada.
    if (value === null || value === undefined || String(value).trim() === '') {
      return null;
    }

    return (
      <div className={`meta-item ${isFullWidth ? 'full-width' : ''}`}>
        <span className="meta-label">{label}</span>
        <span className="meta-value">{value}</span>
      </div>
    );
  };

  const genresList = book.Genres?.map((g) => g.name).join(', ');
  const subgenresList = book.Subgenres?.map((s) => s.name).join(', ');
  const translatorsList = book.Translators?.map((t) => t.name).join(', ');

  const formattedAcquisitionDate = formatDateSafe(book.acquisitionDate);

  return (
    <>
      <div className="meta-grid">
        {/* Renderização limpa e declarativa dos campos */}
        {renderMetaItem('Gênero', genresList)}
        {renderMetaItem('Subgêneros', subgenresList)}
        {renderMetaItem('ISBN', formatISBN(book.isbn))}
        {renderMetaItem('Formato', book.format)}
        {renderMetaItem('Número de Páginas', book.pageCount)}
        {renderMetaItem('Idioma', book.language)}
        {renderMetaItem('Local de Publicação', book.publicationLocation)}
        {renderMetaItem('Ano de Lançamento', book.releaseYear)}
        {renderMetaItem('Editora', book.publisher)}
        {renderMetaItem('Edição', book.edition)}
        {renderMetaItem('Tradutores', translatorsList)}
        {renderMetaItem('Adquirido em', formattedAcquisitionDate)}

        {/* Bloco de Tags só é renderizado se houver pelo menos uma Tag */}
        {book.Tags?.length > 0 && (
          <div className="meta-item full-width">
            <span className="meta-label">Etiquetas (Tags)</span>
            <div className="meta-tags-container">
              {book.Tags.map((tag) => (
                <span key={tag.id} className="meta-tag-pill">
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Renderização condicional das Notas Pessoais */}
      {book.notes && String(book.notes).trim() !== '' && (
        <div className="notes-module">
          <h3 className="notes-title">
            <span className="material-symbols-rounded" aria-hidden="true">
              edit_note
            </span>{' '}
            Notas Pessoais
          </h3>
          <p className="notes-text">{book.notes}</p>
        </div>
      )}
    </>
  );
};

export default BookMetadataGrid;
