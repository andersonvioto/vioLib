import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCitationText } from '../utils/bookHelpers';
import './BookDetailHeader.css';

const BookDetailHeader = ({ book, onDelete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCitationMenu, setShowCitationMenu] = useState(false);

  const backUrl = location.state?.backUrl || '/biblioteca';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setShowCitationMenu(false);
      }
    };

    if (isMenuOpen || showCitationMenu) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, showCitationMenu]);

  const handleCopyCitation = async (format) => {
    try {
      const citationData = getCitationText(book, format);

      const typeHtml = 'text/html';
      const typePlain = 'text/plain';

      const blobHtml = new Blob([citationData.html], { type: typeHtml });
      const blobPlain = new Blob([citationData.plain], { type: typePlain });

      const clipboardItem = new ClipboardItem({
        [typeHtml]: blobHtml,
        [typePlain]: blobPlain
      });

      await navigator.clipboard.write([clipboardItem]);
      alert(
        `Citação no formato ${format} copiada com sucesso! Cole no seu editor para ver a formatação.`
      );
    } catch (error) {
      console.error(
        'Erro ao copiar citação (provavelmente falta de permissão ou navegador não suportado):',
        error
      );
      const citationData = getCitationText(book, format);
      navigator.clipboard.writeText(citationData.plain);
      alert(`Citação (${format}) copiada como texto puro. O navegador bloqueou a formatação rica.`);
    } finally {
      setShowCitationMenu(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="details-toolbar" aria-label="Barra de ações da obra">
      <button
        type="button"
        onClick={() => navigate(backUrl)}
        className="btn-action btn-back-clean"
        aria-label="Voltar para a tela anterior"
      >
        <span className="material-symbols-rounded" aria-hidden="true">
          arrow_back
        </span>
        <span>Voltar</span>
      </button>

      <div className="owner-actions-container">
        {book.isOwner && (
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Opções da Obra"
            aria-label={
              isMenuOpen ? 'Fechar menu de opções da obra' : 'Abrir menu de opções da obra'
            }
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            aria-controls="owner-actions-menu"
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              {isMenuOpen ? 'close' : 'more_vert'}
            </span>
          </button>
        )}

        <nav
          id="owner-actions-menu"
          className={`header-actions ${isMenuOpen ? 'open' : ''}`}
          aria-label="Ações de gestão do livro"
        >
          <div className="citation-container-dropdown">
            <button
              type="button"
              className="btn-action citation-trigger-btn"
              onClick={() => setShowCitationMenu(!showCitationMenu)}
              aria-expanded={showCitationMenu}
              aria-haspopup="true"
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                format_quote
              </span>
              <span className="action-label">Gerar Citação</span>
              <span className="material-symbols-rounded arrow-icon" aria-hidden="true">
                {showCitationMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showCitationMenu && (
              <div
                className="citation-dropdown-menu"
                role="menu"
                aria-label="Formatos de citação disponíveis"
              >
                {['ABNT', 'APA', 'Vancouver', 'Harvard', 'MLA', 'Chicago'].map((format) => (
                  <button
                    key={format}
                    type="button"
                    role="menuitem"
                    onClick={() => handleCopyCitation(format)}
                    className="citation-menu-item"
                  >
                    <span className="badge-format">{format}</span>
                    <span>Copiar referência</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {book.isOwner && (
            <>
              <button
                type="button"
                onClick={() => {
                  navigate('/configuracoes');
                  setIsMenuOpen(false);
                }}
                className="btn-action"
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  settings
                </span>
                <span className="action-label">Ajustes</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/editar-livro/${book.id}`, { state: { backUrl } })}
                className="btn-action edit-btn"
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  edit
                </span>
                <span>Editar Obra</span>
              </button>

              <button type="button" onClick={onDelete} className="btn-action delete-btn">
                <span className="material-symbols-rounded" aria-hidden="true">
                  delete
                </span>
                <span>Excluir</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default BookDetailHeader;
