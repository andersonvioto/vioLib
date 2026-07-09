import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import './TaxonomyManager.css';

/**
 * Gerenciador genérico de taxonomias com Edição Inline.
 * @param {string} endpoint - Caminho da API (ex: 'authors')
 * @param {string} title - Título do painel
 * @param {string} itemLabel - Rótulo para placeholders e botões
 */
const TaxonomyManager = ({ endpoint, title, itemLabel }) => {
  const [items, setItems] = useState([]);

  // Estados para controle da interface de Edição Inline
  const [isAdding, setIsAdding] = useState(false);
  const [addName, setAddName] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get(`/attributes/${endpoint}`);
      setItems(response.data);
    } catch (error) {
      console.error(`Erro ao buscar ${endpoint}:`, error);
    }
  }, [endpoint]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [fetchItems]);

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!addName.trim()) return;

    try {
      await api.post(`/attributes/${endpoint}`, { name: addName });
      setAddName('');
      setIsAdding(false);
      fetchItems();
    } catch (error) {
      alert(error.response?.data?.error || `Erro ao adicionar ${itemLabel}.`);
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setAddName('');
  };

  const startEditing = (id, currentName) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      await api.put(`/attributes/${endpoint}/${editingId}`, { name: editName });
      setEditingId(null);
      setEditName('');
      fetchItems();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao editar registro.');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDisable = async (id) => {
    if (!window.confirm(`Tem certeza que deseja excluir este item?`)) return;
    try {
      await api.delete(`/attributes/${endpoint}/${id}`);
      fetchItems();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir.');
    }
  };

  return (
    <div className="settings-panel">
      <h2>{title}</h2>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="btn-action btn-primary"
          style={{ marginBottom: '20px' }}
        >
          <span className="material-symbols-rounded">add</span> Adicionar {itemLabel}
        </button>
      )}

      <ul className="attribute-list">
        {isAdding && (
          <li className="attribute-item" style={{ borderLeft: '3px solid var(--accent-gold)' }}>
            <form
              onSubmit={handleSubmitAdd}
              style={{ display: 'flex', width: '100%', gap: '10px', alignItems: 'center' }}
            >
              <input
                autoFocus
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="auth-input"
                style={{ padding: '8px', fontSize: '0.95rem', flex: 1 }}
                placeholder={`Nome do novo ${itemLabel.toLowerCase()}`}
              />
              <div className="attribute-actions">
                <button
                  type="submit"
                  className="btn-edit"
                  style={{ color: '#4dff4d', borderColor: '#4dff4d' }}
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={cancelAdd}
                  className="btn-disable-small"
                  style={{ color: '#aaa', borderColor: '#aaa' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </li>
        )}

        {items.map((item) => (
          <li key={item.id} className="attribute-item">
            {editingId === item.id ? (
              <form
                onSubmit={handleSubmitEdit}
                style={{ display: 'flex', width: '100%', gap: '10px', alignItems: 'center' }}
              >
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="auth-input"
                  style={{ padding: '8px', fontSize: '0.95rem', flex: 1 }}
                />
                <div className="attribute-actions">
                  <button
                    type="submit"
                    className="btn-edit"
                    style={{ color: '#4dff4d', borderColor: '#4dff4d' }}
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn-disable-small"
                    style={{ color: '#aaa', borderColor: '#aaa' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <span>{item.name}</span>
                <div className="attribute-actions">
                  <button onClick={() => startEditing(item.id, item.name)} className="btn-edit">
                    Editar
                  </button>
                  <button onClick={() => handleDisable(item.id)} className="btn-disable-small">
                    Excluir
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && !isAdding && (
          <li className="empty-msg">Nenhum registro encontrado.</li>
        )}
      </ul>
    </div>
  );
};

export default TaxonomyManager;
