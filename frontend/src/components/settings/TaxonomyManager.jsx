import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import './TaxonomyManager.css';

/**
 * Gerenciador genérico de taxonomias com Edição Inline e Busca Textual.
 * @param {string} endpoint - Caminho da API (ex: 'authors')
 * @param {string} title - Título do painel
 * @param {string} itemLabel - Rótulo para placeholders e botões
 */
const TaxonomyManager = ({ endpoint, title, itemLabel }) => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Estado da barra de busca

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

  // Função utilitária para remover acentos e transformar em minúsculas
  const normalizeText = (text) => {
    return text
      .normalize('NFD') // Separa os acentos das letras
      .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
      .toLowerCase(); // Tudo minúsculo
  };

  // Aplica o filtro de texto em tempo real (ignorando acentos e maiúsculas)
  const filteredItems = items.filter((item) =>
    normalizeText(item.name).includes(normalizeText(searchTerm))
  );

  return (
    <div className="settings-panel">
      <h2>{title}</h2>

      {/* Barra de Ações: Adicionar e Buscar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          marginBottom: '20px',
          alignItems: 'center'
        }}
      >
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-action btn-primary"
            style={{ margin: 0 }}
          >
            <span className="material-symbols-rounded">add</span> Adicionar {itemLabel}
          </button>
        )}

        {items.length > 0 && (
          <div
            style={{
              flex: 1,
              minWidth: '200px',
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 15px'
            }}
          >
            <span
              className="material-symbols-rounded"
              style={{ color: 'var(--text-muted)', marginRight: '10px' }}
            >
              search
            </span>
            <input
              type="text"
              placeholder={`Pesquisar ${itemLabel.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '12px 0',
                outline: 'none',
                fontSize: '0.95rem'
              }}
            />
            {searchTerm && (
              <span
                className="material-symbols-rounded"
                style={{
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  marginLeft: '10px',
                  fontSize: '1.2rem'
                }}
                onClick={() => setSearchTerm('')}
                title="Limpar busca"
              >
                close
              </span>
            )}
          </div>
        )}
      </div>

      <ul className="attribute-list">
        {isAdding && (
          <li className="attribute-item" style={{ borderLeft: '3px solid var(--accent-gold)' }}>
            <form
              onSubmit={handleSubmitAdd}
              style={{
                display: 'flex',
                width: '100%',
                gap: '10px',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <input
                autoFocus
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="auth-input"
                style={{ padding: '8px', fontSize: '0.95rem', flex: 1, minWidth: '150px' }}
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

        {filteredItems.map((item) => (
          <li key={item.id} className="attribute-item">
            {editingId === item.id ? (
              <form
                onSubmit={handleSubmitEdit}
                style={{
                  display: 'flex',
                  width: '100%',
                  gap: '10px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="auth-input"
                  style={{ padding: '8px', fontSize: '0.95rem', flex: 1, minWidth: '150px' }}
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
                <div className="attribute-info">
                  <span className="attribute-name-text">
                    {item.name}
                    <span className="attribute-badge" title="Livros vinculados">
                      ({item.bookCount || 0})
                    </span>
                  </span>
                </div>

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

        {items.length > 0 && filteredItems.length === 0 && !isAdding && (
          <li className="empty-msg">
            Nenhum {itemLabel.toLowerCase()} encontrado para &quot;{searchTerm}&quot;.
          </li>
        )}
      </ul>
    </div>
  );
};

export default TaxonomyManager;
