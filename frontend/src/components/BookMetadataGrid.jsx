import { formatDateSafe, formatISBN } from '../utils/bookHelpers';
import './BookMetadataGrid.css';

/**
 * Componente visual puramente apresentacional (Dumb Component).
 * Renderiza os metadados do livro aplicando princípios de hierarquia visual e tipografia.
 * * @param {Object} props.book - Objeto com os dados detalhados da obra.
 */
const BookMetadataGrid = ({ book }) => {
  
  /**
   * Helper interno para padronizar a renderização de cada bloco de metadado.
   * Evita a repetição de JSX e garante consistência visual.
   * * @param {string} label - O rótulo do campo (ex: 'Editora').
   * @param {string|Number} value - O valor a ser exibido.
   * @param {boolean} [isFullWidth=false] - Força o item a ocupar toda a largura do Grid.
   */
  const renderMetaItem = (label, value, isFullWidth = false) => {
    // Se não houver valor, aplicamos um traço sutil para indicar ausência de dado
    const displayValue = value || <span className="meta-empty-state">—</span>;
    
    return (
      <div className={`meta-item ${isFullWidth ? 'full-width' : ''}`}>
        <span className="meta-label">{label}</span>
        <span className="meta-value">{displayValue}</span>
      </div>
    );
  };

  // Formata os arrays para strings separadas por vírgula
  const genresList = book.Genres?.map(g => g.name).join(', ');
  const subgenresList = book.Subgenres?.map(s => s.name).join(', ');
  const translatorsList = book.Translators?.map(t => t.name).join(', ');
  
  // Tratamento da data usando a função segura para isolar o fuso horário
  const formattedAcquisitionDate = formatDateSafe(book.acquisitionDate);

  return (
    <>
      <div className="meta-grid">
        {/* Renderização limpa e declarativa dos campos */}
        {renderMetaItem('Gênero', genresList)}
        {renderMetaItem('Subgêneros', subgenresList)}
        {renderMetaItem('ISBN', formatISBN(book.isbn))}
        {renderMetaItem('Local de Publicação', book.publicationLocation)}
        {renderMetaItem('Ano de Lançamento', book.releaseYear)}
        {renderMetaItem('Editora', book.publisher)}
        {renderMetaItem('Edição', book.edition)}
        {renderMetaItem('Tradutores', translatorsList)}
        {renderMetaItem('Adquirido em', formattedAcquisitionDate)}

        {/* Bloco dedicado e destacado para as Tags (Full Width) */}
        <div className="meta-item full-width">
          <span className="meta-label">Etiquetas (Tags)</span>
          <div className="meta-tags-container">
            {book.Tags?.length > 0 ? (
              book.Tags.map(tag => (
                <span key={tag.id} className="meta-tag-pill">
                  #{tag.name}
                </span>
              ))
            ) : (
              <span className="meta-empty-state">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Renderização condicional das Notas Pessoais */}
      {book.notes && (
        <div className="notes-module">
          <h3 className="notes-title">
            <span className="material-symbols-rounded">edit_note</span> Notas Pessoais
          </h3>
          <p className="notes-text">{book.notes}</p>
        </div>
      )}
    </>
  );
};

export default BookMetadataGrid;