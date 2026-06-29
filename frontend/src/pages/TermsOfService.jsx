import { useNavigate } from 'react-router-dom';
import { TermsContent } from '../components/LegalContent';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <button 
        onClick={() => navigate('/login')} 
        className="btn-action" 
        style={{ marginBottom: '30px', border: 'none' }}
      >
        <span className="material-symbols-rounded">arrow_back</span> Voltar
      </button>

      <h1 style={{ color: 'var(--accent-gold)', marginBottom: '30px', fontSize: '2.5em', fontFamily: 'serif' }}>
        Termos de Serviço
      </h1>
      
      <div style={{ background: 'var(--bg-surface)', padding: '40px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <TermsContent />
      </div>
    </div>
  );
};

export default TermsOfService;