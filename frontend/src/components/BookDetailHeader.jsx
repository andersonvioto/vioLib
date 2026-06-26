import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCitationText } from '../utils/bookHelpers';
import './BookDetailHeader.css';

const BookDetailHeader = ({ book, onDelete }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCitationMenu, setShowCitationMenu] = useState(false);

  const handleCopyCitation = (format) => {
    const text = getCitationText(book, format);
    navigator.clipboard.writeText(text);
    alert(`Citação no formato ${format} copiada com sucesso!`);
    setShowCitationMenu(false); 
    setIsMenuOpen(false);
  };

  return (
    <div className="details-header">
      <button onClick={() => navigate('/biblioteca')} className="btn-action btn-back-clean">
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
            <span className="material-symbols-rounded">
              {isMenuOpen ? 'close' : 'more_vert'}
            </span>
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
                {['ABNT', 'APA', 'Vancouver', 'Harvard'].map(format => (
                  <button key={format} onClick={() => handleCopyCitation(format)} className="citation-menu-item">
                    <span className="badge-format">{format}</span> Copiar referência
                  </button>
                ))}
              </div>
            )}
          </div>

          {book.isOwner && (
            <>
              <button onClick={() => navigate(`/editar-livro/${book.id}`)} className="btn-action edit-btn">
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