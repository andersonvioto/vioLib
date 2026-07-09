import { useDragScroll } from '../hooks/useDragScroll';
import './Shelf.css'; // Importação do estilo isolado do componente

/**
 * Componente de prateleira virtual com rolagem horizontal (drag-to-scroll).
 * Utilizado para exibir categorias, gêneros ou tags como "pílulas" clicáveis.
 *
 * @param {Object} props
 * @param {Array} props.items - Lista de itens a serem exibidos (devem ter id e name).
 * @param {string} props.activeItem - Nome do item atualmente selecionado.
 * @param {Function} props.onSelect - Função de callback disparada ao clicar em um item.
 * @param {string} props.defaultLabel - Texto do botão principal (ex: "Toda a Biblioteca").
 * @param {boolean} [props.isSubgenre=false] - Define se a prateleira deve usar o estilo visual reduzido de subgênero.
 */
const Shelf = ({
  items = [],
  activeItem,
  onSelect,
  defaultLabel = 'Todos',
  isSubgenre = false
}) => {
  // Inicializa o nosso custom hook de física e rolagem
  const { ref, events, scrollShelf } = useDragScroll();

  // Se não houver itens e for um subgênero, não renderiza a prateleira vazia
  if (isSubgenre && items.length === 0) return null;

  // Classes CSS dinâmicas baseadas no tipo de prateleira
  const wrapperClass = `shelf-wrapper ${isSubgenre ? 'subgenre-wrapper' : ''}`;
  const containerClass = `virtual-shelves-container ${isSubgenre ? 'subgenre-shelves' : ''}`;
  const navBtnClass = `shelf-nav-btn ${isSubgenre ? 'sub-nav' : ''}`;
  const pillClass = `shelf-pill ${isSubgenre ? 'sub-pill' : ''}`;

  return (
    <div className={wrapperClass}>
      {/* Botão de Rolagem Esquerda */}
      <button className={`${navBtnClass} left`} onClick={() => scrollShelf('left')}>
        <span className="material-symbols-rounded">chevron_left</span>
      </button>

      {/* Contêiner com física de arrasto (Drag to Scroll) */}
      <div
        className={containerClass}
        ref={ref}
        {...events} // Espalha os eventos de mouse (onMouseDown, onMouseMove, etc)
      >
        {/* Pílula Padrão (Limpar Filtro) */}
        <button
          className={`${pillClass} ${activeItem === '' ? 'active' : ''}`}
          onClick={() => onSelect('')}
        >
          {defaultLabel}
        </button>

        {/* Mapeamento dos Itens da Prateleira */}
        {items.map((item) => (
          <button
            key={item.id}
            className={`${pillClass} ${activeItem === item.name ? 'active' : ''}`}
            onClick={() => onSelect(item.name)}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Botão de Rolagem Direita */}
      <button className={`${navBtnClass} right`} onClick={() => scrollShelf('right')}>
        <span className="material-symbols-rounded">chevron_right</span>
      </button>
    </div>
  );
};

export default Shelf;
