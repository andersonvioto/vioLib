import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import './TaxonomyManager.css';

/**
 * Gestor de Utilizadores Bloqueados (UGC Compliance)
 */
const BlockManager = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlockedUsers = useCallback(async () => {
    // Barreira de micro-tarefa para evitar "cascading renders" alertados pelo linter
    await Promise.resolve();

    try {
      const response = await api.get('/blocks');
      setBlockedUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários bloqueados.', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initFetch = async () => {
      await fetchBlockedUsers();
    };
    initFetch();
  }, [fetchBlockedUsers]);

  const handleUnblock = async (blockedId, name) => {
    if (!window.confirm(`Tem a certeza que deseja desbloquear ${name}?`)) return;

    try {
      await api.delete(`/blocks/${blockedId}`);
      setBlockedUsers((prev) => prev.filter((b) => b.blockedId !== blockedId));
    } catch (error) {
      alert('Erro ao desbloquear usuário.');
      console.error(error);
    }
  };

  return (
    <div className="settings-panel">
      <header className="panel-header-clean">
        <h2 className="panel-main-title">Usuários Bloqueados</h2>
      </header>

      <p
        style={{
          color: 'var(--text-secondary)',
          marginBottom: '20px',
          fontSize: '0.95em',
          lineHeight: '1.5'
        }}
      >
        As pessoas que você bloquear não poderão ver os seus comentários, enviar-lhe pedidos de
        amizade ou aceder ao seu perfil público.
      </p>

      {isLoading ? (
        <div className="empty-msg">A carregar lista de bloqueios...</div>
      ) : blockedUsers.length === 0 ? (
        <div className="empty-msg">
          <span
            className="material-symbols-rounded"
            style={{ fontSize: '2em', display: 'block', marginBottom: '10px' }}
          >
            verified_user
          </span>
          Você não tem nenhum usuário bloqueado.
        </div>
      ) : (
        <ul className="attribute-list">
          {blockedUsers.map((block) => (
            <li key={block.id} className="attribute-item">
              <div className="attribute-info">
                <span className="attribute-name-text">
                  <span>{block.Blocked?.name}</span>
                  <span
                    style={{ display: 'block', fontSize: '0.85em', color: 'var(--text-muted)' }}
                  >
                    @{block.Blocked?.username}
                  </span>
                </span>
              </div>
              <div className="attribute-actions">
                <button
                  type="button"
                  onClick={() => handleUnblock(block.blockedId, block.Blocked?.name)}
                  className="btn-disable"
                >
                  Desbloquear
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlockManager;
