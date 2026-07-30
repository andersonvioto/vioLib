import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCitationText } from '../utils/bookHelpers';
import './BookContextMenu.css';

/**
 * Componente flutuante para o Menu de Contexto.
 * Adapta-se automaticamente a "Bottom Sheet" em dispositivos móveis.
 *
 * @param {Object} props.contextMenu - Coordenadas {x, y} e os dados do {book}.
 * @param {Function} props.onClose - Função para fechar o menu.
 * @param {Function} props.onUpdateStatus - Função para alterar o status de leitura.
 * @param {Function} props.onDeleteBook - Função para excluir o livro.
 * @param {boolean} props.isGuest - Indica se o usuário está visualizando a biblioteca de outra pessoa.
 */
const BookContextMenu = ({ contextMenu, onClose, onUpdateStatus, onDeleteBook, isGuest }) => {
  const navigate = useNavigate();
  const [showCitationOptions, setShowCitationOptions] = useState(false);

  if (!contextMenu) return null;

  const { x, y, book } = contextMenu;

  const handleCopyCitation = async (format) => {
    try {
      const citationData = getCitationText(book, format);
      const blobHtml = new Blob([citationData.html], { type: 'text/html' });
      const blobPlain = new Blob([citationData.plain], { type: 'text/plain' });
      const clipboardItem = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobPlain
      });
      await navigator.clipboard.write([clipboardItem]);
      alert(`Referência em ${format} copiada com sucesso!`);
    } catch (err) {
      console.error('Erro ao copiar referência:', err);
      const citationData = getCitationText(book, format);
      navigator.clipboard.writeText(citationData.plain);
      alert(`Referência em ${format} copiada como texto puro.`);
    }
    onClose();
  };

  return (
    <div
      className="context-menu-overlay"
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClose}
    >
      <div
        className="context-menu-box"
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="context-menu-header">{book.title}</div>

        <button
          className="context-menu-item hide-on-mobile-pwa"
          onClick={() => {
            window.open(`/livro/${book.id}`, '_blank');
            onClose();
          }}
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            open_in_new
          </span>{' '}
          Abrir numa Nova Aba
        </button>

        <div className="context-menu-dropdown">
          <button
            className="context-menu-item"
            onClick={() => setShowCitationOptions(!showCitationOptions)}
            aria-expanded={showCitationOptions}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              format_quote
            </span>{' '}
            Copiar Referência
            <span className="material-symbols-rounded arrow-indicator" aria-hidden="true">
              {showCitationOptions ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {showCitationOptions && (
            <div className="context-menu-submenu-list">
              {['ABNT', 'APA', 'Vancouver', 'MLA', 'Chicago'].map((fmt) => (
                <button
                  key={fmt}
                  className="context-menu-item sub-item citation-fmt-btn"
                  onClick={() => handleCopyCitation(fmt)}
                >
                  Formato {fmt}
                </button>
              ))}
            </div>
          )}
        </div>

        {!isGuest && (
          <>
            <div className="context-menu-divider" aria-hidden="true"></div>

            <button
              className="context-menu-item"
              onClick={() => {
                navigate(`/editar-livro/${book.id}`, { state: { backUrl: '/biblioteca' } });
                onClose();
              }}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                edit
              </span>{' '}
              Editar Dados
            </button>

            <div className="context-menu-submenu-title">Alterar Status:</div>

            <button
              className="context-menu-item sub-item"
              onClick={() => {
                onUpdateStatus(book, 'reading');
                onClose();
              }}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                import_contacts
              </span>{' '}
              Lendo
            </button>

            <button
              className="context-menu-item sub-item"
              onClick={() => {
                onUpdateStatus(book, 'read');
                onClose();
              }}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                task_alt
              </span>{' '}
              Lido
            </button>

            <button
              className="context-menu-item sub-item"
              onClick={() => {
                onUpdateStatus(book, 'unread');
                onClose();
              }}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                book
              </span>{' '}
              Não Lido
            </button>

            <div className="context-menu-divider" aria-hidden="true"></div>

            <button
              className="context-menu-item danger"
              onClick={() => {
                onDeleteBook(book);
                onClose();
              }}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                delete
              </span>{' '}
              Excluir Obra
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BookContextMenu;
