import { useState, useEffect } from 'react';
import api from '../../services/api';
import './TaxonomyManager.css';

const ShareSettings = () => {
  const [sharedWith, setSharedWith] = useState([]);

  const fetchShares = async () => {
    try {
      const response = await api.get('/access/my-shares');
      setSharedWith(response.data);
    } catch (error) {
      console.error('Erro ao buscar compartilhamentos.', error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchShares();
  }, []);

  const handleRevokeAccess = async (guestId, guestName) => {
    if (!window.confirm(`Deseja revogar o acesso de ${guestName}?`)) return;
    try {
      await api.delete(`/access/revoke/${guestId}`);
      fetchShares();
    } catch (error) {
      console.error(error);
      alert('Erro ao revogar acesso.');
    }
  };

  const handleTogglePermission = async (guestId, field, currentValue) => {
    try {
      // Encontra o usuário na lista local para pegar as permissões atuais
      const guestObj = sharedWith.find((s) => s.guestId === guestId);
      if (!guestObj) return;

      const payload = {
        canViewLibrary: field === 'canViewLibrary' ? !currentValue : guestObj.canViewLibrary,
        canViewCollections:
          field === 'canViewCollections' ? !currentValue : guestObj.canViewCollections
      };

      await api.put(`/access/shares/${guestId}`, payload);

      // Atualiza o estado local otimisticamente
      setSharedWith((prev) => prev.map((s) => (s.guestId === guestId ? { ...s, ...payload } : s)));
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar as permissões.');
    }
  };

  return (
    <div className="settings-panel">
      <h2>Pessoas com Acesso</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.95em' }}>
        Controle quem tem acesso ao seu acervo e quais áreas cada pessoa pode visualizar.
      </p>

      <ul className="attribute-list">
        {sharedWith.map((share) => (
          <li
            key={share.id}
            className="attribute-item"
            style={{ flexDirection: 'column', alignItems: 'stretch' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%'
              }}
            >
              <div>
                <strong
                  style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-primary)' }}
                >
                  {share.Guest?.name}
                </strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {share.Guest?.email}
                </span>
              </div>
              <button
                onClick={() => handleRevokeAccess(share.guestId, share.Guest?.name)}
                className="btn-disable"
              >
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '5px' }}
                >
                  person_remove
                </span>{' '}
                Revogar
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '20px',
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px dashed var(--border-color)',
                flexWrap: 'wrap'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9em'
                }}
              >
                <input
                  type="checkbox"
                  checked={share.canViewLibrary}
                  onChange={() =>
                    handleTogglePermission(share.guestId, 'canViewLibrary', share.canViewLibrary)
                  }
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                />
                Acesso à Biblioteca
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9em'
                }}
              >
                <input
                  type="checkbox"
                  checked={share.canViewCollections}
                  onChange={() =>
                    handleTogglePermission(
                      share.guestId,
                      'canViewCollections',
                      share.canViewCollections
                    )
                  }
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                />
                Acesso às Coleções
              </label>
            </div>
          </li>
        ))}
        {sharedWith.length === 0 && <li className="empty-msg">Nenhum compartilhamento ativo.</li>}
      </ul>
    </div>
  );
};

export default ShareSettings;
