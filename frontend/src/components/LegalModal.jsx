import { TermsContent, PrivacyContent } from './LegalContent';
import './LegalModal.css';

/**
 * Modal responsivo para exibir os textos legais por cima de outras telas (ex: Cadastro)
 * @param {string} type - 'terms' ou 'privacy'
 * @param {function} onClose - Função para fechar o modal
 */
const LegalModal = ({ type, onClose }) => {
  const isTerms = type === 'terms';

  // Impede que o clique dentro do quadro do modal feche o overlay
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="legal-modal-overlay" onClick={onClose}>
      <div className="legal-modal-box" onClick={handleContentClick}>
        
        <header className="legal-modal-header">
          <h2 className="legal-modal-title">
            <span className="material-symbols-rounded">
              {isTerms ? 'gavel' : 'shield_person'}
            </span>
            {isTerms ? 'Termos de Serviço' : 'Política de Privacidade'}
          </h2>
          <button className="legal-modal-close" onClick={onClose} title="Fechar">
            <span className="material-symbols-rounded">close</span>
          </button>
        </header>

        <div className="legal-modal-content">
          {isTerms ? <TermsContent /> : <PrivacyContent />}
        </div>

        <footer className="legal-modal-footer">
          <button className="btn-action btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
            Entendido
          </button>
        </footer>

      </div>
    </div>
  );
};

export default LegalModal;