import './FilterDrawer.css';

/**
 * Componente da gaveta lateral de filtros e ordenação.
 * Permite ao usuário refinar a busca de livros na biblioteca.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla a visibilidade da gaveta.
 * @param {Function} props.onClose - Função para fechar a gaveta.
 * @param {string} props.sortBy - Critério de ordenação atual.
 * @param {Function} props.setSortBy - Função para atualizar o critério de ordenação.
 * @param {string} props.sortOrder - Ordem (ASC/DESC).
 * @param {Function} props.setSortOrder - Função para atualizar a ordem.
 * @param {string} props.selectedTag - Tag atualmente filtrada.
 * @param {Function} props.setSelectedTag - Função para atualizar a tag filtrada.
 * @param {string} props.readingStatus - Status de leitura atualmente filtrado.
 * @param {Function} props.setReadingStatus - Função para atualizar o status de leitura filtrado.
 * @param {Array} props.availableTags - Lista de tags disponíveis para o dropdown.
 * @param {boolean} props.showOnlyBorrowed - Estado do toggle de livros emprestados.
 * @param {Function} props.setShowOnlyBorrowed - Função para atualizar o toggle de empréstimo.
 * @param {boolean} props.showTagsOnCards - Estado do toggle de exibição de tags nos cards.
 * @param {Function} props.setShowTagsOnCards - Função para atualizar o toggle de exibição de tags.
 */
const FilterDrawer = ({
  isOpen,
  onClose,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  selectedTag,
  setSelectedTag,
  readingStatus,
  setReadingStatus,
  availableTags,
  showOnlyBorrowed,
  setShowOnlyBorrowed,
  showTagsOnCards,
  setShowTagsOnCards
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="filter-drawer-backdrop" onClick={onClose}></div>

      <div className="filter-drawer-container">
        <div className="filter-drawer-header">
          <h3>
            <span className="material-symbols-rounded">tune</span> Refinamento
          </h3>
          <button className="close-drawer-btn" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="filter-drawer-grid">
          {/* Ordenação */}
          <div className="filter-field-group">
            <label className="form-label">
              <span className="material-symbols-rounded">sort</span> Ordenar por
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select"
                style={{ flex: 1 }}
              >
                <option value="title">Título</option>
                <option value="author">Autor Principal</option>
                <option value="releaseYear">Ano de Lançamento</option>
                <option value="createdAt">Data de Inclusão</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="form-select"
              >
                <option value="ASC">Crescente</option>
                <option value="DESC">Decrescente</option>
              </select>
            </div>
          </div>

          {/* Filtro por Tag */}
          <div className="filter-field-group">
            <label className="form-label">
              <span className="material-symbols-rounded">style</span> Filtrar por Tag
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="form-select"
            >
              <option value="">Todas as Tags</option>
              {availableTags.map((t) => (
                <option key={t.id} value={t.name}>
                  #{t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status de Leitura */}
          <div className="filter-field-group">
            <label className="form-label">
              <span className="material-symbols-rounded">menu_book</span> Status de Leitura
            </label>
            <select
              value={readingStatus}
              onChange={(e) => setReadingStatus(e.target.value)}
              className="form-select"
            >
              <option value="">Todos os Livros</option>
              <option value="unread">Não Lidos</option>
              <option value="reading">Estou Lendo</option>
              <option value="read">Já Lidos</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="filter-field-group full-width toggles-row">
            <label className="checkbox-toggle-label">
              <input
                type="checkbox"
                checked={showOnlyBorrowed}
                onChange={(e) => setShowOnlyBorrowed(e.target.checked)}
              />
              <span>Apenas Emprestados</span>
            </label>

            <label className="checkbox-toggle-label">
              <input
                type="checkbox"
                checked={showTagsOnCards}
                onChange={(e) => setShowTagsOnCards(e.target.checked)}
              />
              <span>Exibir etiquetas (#tags)</span>
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterDrawer;
