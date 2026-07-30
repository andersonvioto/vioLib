import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './TaxonomyManager.css';

/**
 * Gerenciador genérico de taxonomias com Edição Inline, Busca Textual e Alvos PWA.
 * @param {string} props.endpoint - Caminho da API ('authors' | 'translators')
 * @param {string} props.title - Título do painel editorial
 * @param {string} props.itemLabel - Rótulo para placeholders e botões
 */
const TaxonomyManager = ({ endpoint, title, itemLabel }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [addName, setAddName] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchItems = useCallback(async () => {
    await Promise.resolve(); // Barreira assíncrona
    try {
      const response = await api.get(`/attributes/${endpoint}`);
      setItems(response.data);
    } catch (error) {
      console.error(`Erro ao buscar ${endpoint}:`, error);
    }
  }, [endpoint]);

  useEffect(() => {
    const init = async () => {
      await fetchItems();
    };
    init();
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

  const normalizeText = (text) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const filteredItems = items.filter((item) =>
    normalizeText(item.name).includes(normalizeText(searchTerm))
  );

  const getFilterParam = () => {
    if (endpoint === 'authors') return 'author';
    if (endpoint === 'translators') return 'translator';
    return 'search';
  };

  return (
    <div className="settings-panel">
      <header className="panel-header-clean">
        <h2 className="panel-main-title">{title}</h2>
      </header>

      <div className="taxonomy-toolbar">
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="btn-action btn-primary btn-add-main"
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              add
            </span>
            <span>Adicionar {itemLabel}</span>
          </button>
        )}

        {items.length > 0 && (
          <div className="search-wrapper-clean" role="search">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">
              search
            </span>
            <input
              type="text"
              placeholder={`Pesquisar ${itemLabel.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-clean"
              aria-label={`Pesquisar na lista de ${itemLabel.toLowerCase()}s`}
            />
            {searchTerm && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchTerm('')}
                title="Limpar busca"
                aria-label="Limpar termo de busca"
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  close
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <ul className="attribute-list" role="list" aria-label={`Lista de ${title}`}>
        {isAdding && (
          <li className="attribute-item attribute-item-adding">
            <form onSubmit={handleSubmitAdd} className="inline-edit-form">
              <input
                autoFocus
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="form-input inline-input"
                placeholder={`Nome do novo ${itemLabel.toLowerCase()}...`}
              />
              <div className="inline-form-actions">
                <button type="submit" className="btn-action btn-save-success">
                  <span>Salvar</span>
                </button>
                <button type="button" onClick={cancelAdd} className="btn-action btn-cancel-inline">
                  <span>Cancelar</span>
                </button>
              </div>
            </form>
          </li>
        )}

        {filteredItems.map((item) => (
          <li key={item.id} className="attribute-item">
            {editingId === item.id ? (
              <form onSubmit={handleSubmitEdit} className="inline-edit-form">
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input inline-input"
                />
                <div className="inline-form-actions">
                  <button type="submit" className="btn-action btn-save-success">
                    <span>Salvar</span>
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn-action btn-cancel-inline"
                  >
                    <span>Cancelar</span>
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="attribute-info">
                  <span className="attribute-name-text">
                    <span>{item.name}</span>
                    <button
                      type="button"
                      className="attribute-badge-link"
                      title="Ver livros associados na Biblioteca"
                      onClick={() =>
                        navigate(`/biblioteca?${getFilterParam()}=${encodeURIComponent(item.name)}`)
                      }
                    >
                      <span>({item.bookCount || 0})</span>
                    </button>
                  </span>
                </div>

                <div className="attribute-actions">
                  <button
                    type="button"
                    onClick={() => startEditing(item.id, item.name)}
                    className="btn-action btn-edit-taxonomy"
                    aria-label={`Editar ${itemLabel.toLowerCase()} ${item.name}`}
                  >
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDisable(item.id)}
                    className="btn-action btn-delete-taxonomy"
                    aria-label={`Excluir ${itemLabel.toLowerCase()} ${item.name}`}
                  >
                    <span>Excluir</span>
                  </button>
                </div>
              </>
            )}
          </li>
        ))}

        {items.length === 0 && !isAdding && (
          <li className="empty-msg" role="status">
            <span>Nenhum registro cadastrado nesta taxonomia.</span>
          </li>
        )}

        {items.length > 0 && filteredItems.length === 0 && !isAdding && (
          <li className="empty-msg" role="status">
            <span>
              Nenhum {itemLabel.toLowerCase()} encontrado para &quot;{searchTerm}&quot;.
            </span>
          </li>
        )}
      </ul>
    </div>
  );
};

export default TaxonomyManager;
