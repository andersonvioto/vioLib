import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCitationText } from '../utils/bookHelpers';
import './BookDetailHeader.css';

const BookDetailHeader = ({ book, onDelete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCitationMenu, setShowCitationMenu] = useState(false);

  // Lê a rota de origem (se houver). Se não houver, assume a biblioteca como padrão.
  const backUrl = location.state?.backUrl || '/biblioteca';

  const handleCopyCitation = async (format) => {
    try {
      const citationData = getCitationText(book, format);

      // A Mágica do Rich Text para manter negrito e itálico
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
      // Fallback seguro: se a API moderna falhar (ex: HTTP local sem SSL), usa o método antigo de texto puro
      const citationData = getCitationText(book, format);
      navigator.clipboard.writeText(citationData.plain);
      alert(`Citação (${format}) copiada como texto puro. O navegador bloqueou a formatação rica.`);
    } finally {
      setShowCitationMenu(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="details-header">
      {/* O Botão agora volta de forma absoluta para a origem inteligente */}
      <button onClick={() => navigate(backUrl)} className="btn-action btn-back-clean">
        <span className="material-symbols-rounded">arrow_back</span>
        Voltar
      </button>

      <div className="owner-actions-container">
        {book.isOwner && (
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Opções da Obra"
          >
            <span className="material-symbols-rounded">{isMenuOpen ? 'close' : 'more_vert'}</span>
          </button>
        )}

        <div className={`header-actions ${isMenuOpen ? 'open' : ''}`}>
          <div className="citation-container-dropdown">
            <button
              type="button"
              className="btn-action citation-trigger-btn"
              onClick={() => setShowCitationMenu(!showCitationMenu)}
            >
              <span className="material-symbols-rounded">format_quote</span>
              <span className="action-label">Gerar Citação</span>
              <span className="material-symbols-rounded arrow-icon">
                {showCitationMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showCitationMenu && (
              <div className="citation-dropdown-menu">
                {['ABNT', 'APA', 'Vancouver', 'Harvard', 'MLA', 'Chicago'].map((format) => (
                  <button
                    key={format}
                    onClick={() => handleCopyCitation(format)}
                    className="citation-menu-item"
                  >
                    <span className="badge-format">{format}</span> Copiar referência
                  </button>
                ))}
              </div>
            )}
          </div>

          {book.isOwner && (
            <>
              <button
                onClick={() => {
                  navigate('/configuracoes');
                  setIsMenuOpen(false);
                }}
                className="btn-action"
              >
                <span className="material-symbols-rounded">settings</span>
                <span className="action-label">Ajustes</span>
              </button>

              {/* Repassamos a rota de origem para a tela de edição não perder o rastro! */}
              <button
                onClick={() => navigate(`/editar-livro/${book.id}`, { state: { backUrl } })}
                className="btn-action edit-btn"
              >
                <span className="material-symbols-rounded">edit</span> Editar Obra
              </button>

              <button onClick={onDelete} className="btn-action delete-btn">
                <span className="material-symbols-rounded">delete</span> Excluir
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailHeader;
