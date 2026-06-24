import { useState, useEffect } from 'react';
import api from '../../services/api';

const ShareSettings = () => {
  const [sharedWith, setSharedWith] = useState([]);

  const fetchShares = async () => {
    try {
      const response = await api.get('/access/my-shares');
      setSharedWith(response.data);
    } catch (error) {
      console.error("Erro ao buscar compartilhamentos.", error);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleRevokeAccess = async (guestId, guestName) => {
    if (!window.confirm(`Deseja revogar o acesso de ${guestName}?`)) return;
    try {
      await api.delete(`/access/revoke/${guestId}`);
      fetchShares();
    } catch (error) {
      alert("Erro ao revogar acesso.");
    }
  };

  return (
    <div className="settings-panel">
      <h2>Pessoas com Acesso</h2>
      <ul className="attribute-list">
        {sharedWith.map(share => (
          <li key={share.id} className="attribute-item">
            <div>
              <strong style={{ display: 'block', fontSize: '1.1rem' }}>{share.Guest?.name}</strong>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>{share.Guest?.email}</span>
            </div>
            <button onClick={() => handleRevokeAccess(share.guestId, share.Guest?.name)} className="btn-disable">
              <span className="material-symbols-rounded" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '5px' }}>person_remove</span> Revogar
            </button>
          </li>
        ))}
        {sharedWith.length === 0 && <li className="empty-msg">Nenhum compartilhamento ativo.</li>}
      </ul>
    </div>
  );
};

export default ShareSettings;