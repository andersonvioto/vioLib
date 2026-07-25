import { useNavigate } from 'react-router-dom';
import { TermsContent } from '../components/LegalContent';
import './LegalPages.css';

/**
 * Página pública de Termos de Serviço.
 * Consome o CSS mestre editorial para documentos jurídicos.
 */
const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <main className="legal-page-container">
      <nav className="legal-page-header">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="btn-back-legal"
          aria-label="Voltar para a tela de login inicial"
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            arrow_back
          </span>
          <span>Voltar</span>
        </button>
      </nav>

      <h1 className="legal-doc-title">Termos de Serviço</h1>

      <article className="legal-doc-card" aria-label="Conteúdo integral dos Termos de Serviço">
        <TermsContent />
      </article>
    </main>
  );
};

export default TermsOfService;
