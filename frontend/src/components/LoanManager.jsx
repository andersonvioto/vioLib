import { useState } from 'react';
import api from '../services/api';
import { formatDateSafe } from '../utils/bookHelpers';
import './LoanManager.css';

const LoanManager = ({ bookId, activeLoan, onUpdate }) => {
  const [borrowerName, setBorrowerName] = useState('');
  const [loanDate, setLoanDate] = useState('');

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/loans', { borrowerName, loanDate, BookId: bookId });
      setBorrowerName('');
      setLoanDate('');
      onUpdate(); // Aciona o recarregamento dos dados na página mãe
    } catch (error) {
      alert('Erro ao registrar empréstimo.');
    }
  };

  const handleReturn = async (loanId) => {
    try {
      const d = new Date();
      const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      await api.put(`/loans/${loanId}/return`, { returnDate: localToday });
      onUpdate(); 
    } catch (error) {
      alert('Erro ao registrar devolução.');
    }
  };

  return (
    <div className="loan-module">
      <h3 className="loan-title">
        <span className="material-symbols-rounded">handshake</span> 
        Controle de Empréstimo
      </h3>
      
      {activeLoan ? (
        <div className="active-loan-info">
          <p>📖 Atualmente emprestado para: <strong style={{ color: 'var(--accent-gold)' }}>{activeLoan.borrowerName}</strong></p>
          <p>Data do empréstimo: {formatDateSafe(activeLoan.loanDate)}</p>
          <button 
            onClick={() => handleReturn(activeLoan.id)} 
            className="btn-action" 
            style={{ marginTop: '15px', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}
          >
            <span className="material-symbols-rounded">assignment_return</span> Marcar como Devolvido
          </button>
        </div>
      ) : (
        <form onSubmit={handleLoanSubmit} className="loan-form">
          <input 
            placeholder="Nome da pessoa" required value={borrowerName} 
            onChange={(e) => setBorrowerName(e.target.value)} 
            className="form-input" style={{ flex: 1, minWidth: '200px' }}
          />
          <input 
            type="date" required value={loanDate} 
            onChange={(e) => setLoanDate(e.target.value)} 
            className="form-input" 
          />
          <button type="submit" className="btn-action btn-primary">Emprestar</button>
        </form>
      )}
    </div>
  );
};

export default LoanManager;