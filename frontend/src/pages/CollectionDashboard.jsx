import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import api from '../services/api';
import Header from '../components/Header';
import { getCoverUrl } from '../utils/bookHelpers';
import './CollectionDashboard.css';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'var(--bg-input)',
    borderColor: state.isFocused ? 'var(--accent-gold)' : 'var(--border-color)',
    boxShadow: state.isFocused ? '0 0 0 3px var(--accent-gold-glow)' : 'none',
    minHeight: '44px',
    borderRadius: '6px'
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    zIndex: 100
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
    color: state.isFocused ? 'var(--accent-gold)' : 'var(--text-primary)',
    cursor: 'pointer'
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#1e2736',
    border: '1px solid var(--border-color)',
    borderRadius: '4px'
  }),
  multiValueLabel: (provided) => ({ ...provided, color: 'var(--text-primary)' }),
  singleValue: (provided) => ({ ...provided, color: 'var(--text-primary)' }),
  input: (provided) => ({ ...provided, color: 'var(--text-primary)' })
};

const CollectionDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [collection, setCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [libraryBooks, setLibraryBooks] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [itemForm, setItemForm] = useState({
    id: null,
    title: '',
    status: 'missing',
    axisValues: {},
    BookId: null
  });

  const [activeFilters, setActiveFilters] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [hideMissing, setHideMissing] = useState(
    () => localStorage.getItem(`violib_col_hide_missing_${id}`) === 'true'
  );

  const [userSortBy, setUserSortBy] = useState(() => {
    const saved = localStorage.getItem(`violib_col_sort_multi_${id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro de parse no sort:', e);
      }
    }
    return [{ value: 'title', label: 'Título' }];
  });

  const [sortOrder, setSortOrder] = useState(
    () => localStorage.getItem(`violib_col_order_${id}`) || 'ASC'
  );

  const fetchCollection = useCallback(async () => {
    await Promise.resolve();
    try {
      const response = await api.get(`/collections/${id}`);
      setCollection(response.data);
    } catch (error) {
      console.error('Erro ao carregar coleção:', error);
      navigate('/colecoes');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  const fetchLibraryBooks = useCallback(async () => {
    await Promise.resolve();
    try {
      const response = await api.get('/books?limit=5000&sortBy=title&order=ASC');
      setLibraryBooks(response.data.books || []);
    } catch (error) {
      console.error('Erro ao buscar biblioteca:', error);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      await Promise.resolve();
      fetchCollection();
      fetchLibraryBooks();
    };
    initData();
  }, [fetchCollection, fetchLibraryBooks]);

  useEffect(() => {
    localStorage.setItem(`violib_col_sort_multi_${id}`, JSON.stringify(userSortBy));
    localStorage.setItem(`violib_col_order_${id}`, sortOrder);
    localStorage.setItem(`violib_col_hide_missing_${id}`, hideMissing);
  }, [userSortBy, sortOrder, hideMissing, id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const handleDeleteCollection = async () => {
    if (
      window.confirm('Tem a certeza que deseja APAGAR esta coleção inteira e todos os seus itens?')
    ) {
      try {
        await api.delete(`/collections/${id}`);
        navigate('/colecoes');
      } catch (error) {
        console.error('Erro ao apagar coleção:', error);
        alert('Erro ao excluir coleção.');
      }
    }
  };

  const openItemModal = (item = null) => {
    if (item)
      setItemForm({
        id: item.id,
        title: item.title,
        status: item.status,
        axisValues: item.axisValues || {},
        BookId: item.BookId || null
      });
    else setItemForm({ id: null, title: '', status: 'missing', axisValues: {}, BookId: null });
    setIsModalOpen(true);
  };

  const handleItemFormChange = (field, value) =>
    setItemForm((prev) => ({ ...prev, [field]: value }));
  const handleAxisChange = (axisName, value) =>
    setItemForm((prev) => ({ ...prev, axisValues: { ...prev.axisValues, [axisName]: value } }));

  const handleSilentBookCreate = async () => {
    if (!itemForm.title.trim()) return;
    setIsCreatingBook(true);
    try {
      const payload = new FormData();
      payload.append('title', itemForm.title);
      const response = await api.post('/books', payload);
      setLibraryBooks((prev) =>
        [...prev, response.data.book].sort((a, b) => a.title.localeCompare(b.title))
      );
      handleItemFormChange('BookId', response.data.book.id);
    } catch (error) {
      console.error('Erro criar livro mudo:', error);
      alert('Erro ao criar livro.');
    } finally {
      setIsCreatingBook(false);
    }
  };

  const saveItem = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalPayload = { ...itemForm };
      if (finalPayload.status === 'missing') finalPayload.BookId = null;
      if (itemForm.id) await api.put(`/collections/items/${itemForm.id}`, finalPayload);
      else await api.post(`/collections/${id}/items`, finalPayload);
      setIsModalOpen(false);
      fetchCollection();
    } catch (error) {
      console.error('Erro ao salvar item', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async () => {
    if (!itemForm.id) return;
    if (window.confirm('Deseja remover este item da coleção?')) {
      setIsSaving(true);
      try {
        await api.delete(`/collections/items/${itemForm.id}`);
        setIsModalOpen(false);
        fetchCollection();
      } catch (error) {
        console.error('Erro ao deletar item:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBarKeyDown = (e, axis, valName, isActive) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveFilters((prev) => {
        const next = { ...prev };
        if (isActive) delete next[axis];
        else next[axis] = valName;
        return next;
      });
    }
  };

  if (isLoading || !collection) {
    return (
      <div className="dashboard-container">
        <Header />
        <div className="collections-loading">
          <span className="material-symbols-rounded spinner-icon">sync</span>
          <span>Sincronizando o progresso...</span>
        </div>
      </div>
    );
  }

  const { stats, CollectionItems, customAxes } = collection;
  const filteredItems = CollectionItems.filter((item) => {
    for (const axis in activeFilters) {
      if ((item.axisValues[axis] || 'Não categorizado') !== activeFilters[axis]) return false;
    }
    if (hideMissing && item.status === 'missing') return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
    for (const sortOption of userSortBy) {
      const criteria = sortOption.value;
      let valA =
        criteria === 'title'
          ? a.title
          : criteria === 'status'
            ? ({ both: 3, physical: 2, digital: 1, missing: 0 }[a.status] || 0).toString()
            : a.axisValues[criteria] || '';
      let valB =
        criteria === 'title'
          ? b.title
          : criteria === 'status'
            ? ({ both: 3, physical: 2, digital: 1, missing: 0 }[b.status] || 0).toString()
            : b.axisValues[criteria] || '';
      const res = collator.compare(valA, valB);
      if (res !== 0) return sortOrder === 'ASC' ? res : -res;
    }
    if (!userSortBy.some((opt) => opt.value === 'title')) return collator.compare(a.title, b.title);
    return 0;
  });

  return (
    <div className="dashboard-container">
      <Header />
      <section
        className="collection-hero-banner"
        style={{
          backgroundImage: collection.bannerImage
            ? `url(${getCoverUrl(collection.bannerImage)})`
            : 'none'
        }}
      >
        <div className="hero-gradient-overlay"></div>
        <div className="hero-top-bar">
          <button type="button" className="btn-back-hero" onClick={() => navigate('/colecoes')}>
            <span className="material-symbols-rounded">arrow_back</span>
            <span>Voltar</span>
          </button>
          <div className="hero-owner-actions">
            <button
              type="button"
              className="btn-action hero-action-btn"
              onClick={() => navigate(`/colecoes/editar/${id}`)}
            >
              <span className="material-symbols-rounded">edit</span>
            </button>
            <button
              type="button"
              className="btn-action hero-action-btn delete-btn"
              onClick={handleDeleteCollection}
            >
              <span className="material-symbols-rounded">delete</span>
            </button>
          </div>
        </div>
        <div className="hero-content">
          <div className="hero-text-area">
            <h1 className="hero-title">{collection.title}</h1>
            {collection.description && <p className="hero-desc">{collection.description}</p>}
            <div className="hero-stats-pills">
              <span className="stat-pill">
                <span className="material-symbols-rounded">book</span>
                <span>
                  <strong>{stats.ownedItems}</strong> de {stats.totalItems} Itens
                </span>
              </span>
            </div>
          </div>
          <div className="hero-progress-ring" style={{ '--progress': `${stats.progress}%` }}>
            <div className="hero-progress-inner">
              <span className="hero-progress-value">{stats.progress}%</span>
            </div>
          </div>
        </div>
      </section>

      {customAxes && customAxes.length > 0 && stats.totalItems > 0 && (
        <section className="xp-section">
          <header className="section-header-clean">
            <div className="mural-title-wrapper">
              <span className="material-symbols-rounded section-icon">analytics</span>
              <h2 className="section-title">Desempenho por Categoria</h2>
            </div>
          </header>
          <div className="xp-grid">
            {customAxes.map((axis) => (
              <article key={axis} className="xp-card">
                <h3 className="xp-card-title">{axis}</h3>
                <div className="xp-bars-list">
                  {Object.entries(stats.axisStats[axis] || {}).map(([valName, valStats]) => {
                    const pct =
                      valStats.total === 0
                        ? 0
                        : Math.round((valStats.owned / valStats.total) * 100);
                    const isActive = activeFilters[axis] === valName;
                    return (
                      <div
                        key={valName}
                        role="button"
                        tabIndex="0"
                        onKeyDown={(e) => handleBarKeyDown(e, axis, valName, isActive)}
                        className={`xp-bar-container ${isActive ? 'active-filter' : ''}`}
                        onClick={() =>
                          setActiveFilters((prev) => {
                            const next = { ...prev };
                            if (isActive) delete next[axis];
                            else next[axis] = valName;
                            return next;
                          })
                        }
                      >
                        <div className="xp-bar-header">
                          <span className="xp-val-name">
                            <span>{valName}</span>
                          </span>
                          <span className="xp-val-numbers">
                            <strong>{valStats.owned}</strong> / {valStats.total} ({pct}%)
                          </span>
                        </div>
                        <div className="xp-bar-track">
                          <div className="xp-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mural-section">
        <header className="mural-header">
          <div className="mural-header-top">
            <div className="mural-title-wrapper">
              <h2 className="section-title" style={{ margin: 0 }}>
                <span className="material-symbols-rounded section-icon">grid_view</span>
                <span>Mural de Coleção</span>
              </h2>
              {Object.entries(activeFilters).map(([axis, val]) => (
                <span key={axis} className="mural-active-filter">
                  <span>
                    <strong>{axis}:</strong> {val}
                  </span>
                  <button
                    type="button"
                    className="btn-remove-filter-pill"
                    onClick={() =>
                      setActiveFilters((p) => {
                        const n = { ...p };
                        delete n[axis];
                        return n;
                      })
                    }
                  >
                    <span className="material-symbols-rounded">cancel</span>
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              className="btn-action btn-primary btn-add-item-mural"
              onClick={() => openItemModal()}
            >
              <span className="material-symbols-rounded">add</span>
              <span>Adicionar Item</span>
            </button>
          </div>

          {CollectionItems.length > 0 && (
            <div className="mural-toolbar">
              <div className="mural-search">
                <span className="material-symbols-rounded search-icon">search</span>
                <input
                  type="text"
                  placeholder="Buscar item pelo nome..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="mural-search-input"
                />
              </div>
              <label className="mural-checkbox">
                <input
                  type="checkbox"
                  checked={hideMissing}
                  onChange={(e) => setHideMissing(e.target.checked)}
                />
                <span>Ocultar Faltantes</span>
              </label>
              <div className="mural-sort">
                <span className="material-symbols-rounded sort-icon">sort</span>
                <div className="mural-sort-select">
                  <Select
                    isMulti
                    options={[
                      { value: 'title', label: 'Título' },
                      { value: 'status', label: 'Status' },
                      ...(customAxes || []).map((a) => ({ value: a, label: a }))
                    ]}
                    value={userSortBy}
                    onChange={setUserSortBy}
                    styles={customSelectStyles}
                  />
                </div>
                <button
                  type="button"
                  className="btn-action mural-sort-btn"
                  onClick={() => setSortOrder((p) => (p === 'ASC' ? 'DESC' : 'ASC'))}
                >
                  <span className="material-symbols-rounded">
                    {sortOrder === 'ASC' ? 'arrow_downward' : 'arrow_upward'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </header>

        {CollectionItems.length === 0 ? (
          <div className="empty-collections-state">
            <span className="material-symbols-rounded empty-icon">extension_off</span>
            <h2>Coleção Vazia!</h2>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="empty-collections-state">
            <span className="material-symbols-rounded empty-icon">filter_list_off</span>
            <h2>Nenhum item encontrado</h2>
            <button
              type="button"
              className="btn-action btn-empty-clear"
              onClick={() => {
                setActiveFilters({});
                setSearchInput('');
                setSearchQuery('');
                setHideMissing(false);
              }}
            >
              <span>Limpar Todos os Filtros</span>
            </button>
          </div>
        ) : (
          <div className="items-grid">
            {sortedItems.map((item) => {
              const isMissing = item.status === 'missing';
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex="0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') openItemModal(item);
                  }}
                  className={`item-card ${isMissing ? 'status-missing' : 'status-owned'}`}
                  onClick={() => openItemModal(item)}
                >
                  <div className="item-card-header">
                    <div className="item-header-left">
                      <span
                        className={`material-symbols-rounded item-owned-icon ${isMissing ? 'icon-placeholder' : ''}`}
                      >
                        workspace_premium
                      </span>
                      <h4 className="item-card-title">{item.title}</h4>
                    </div>
                    <div className="item-card-actions">
                      <button
                        type="button"
                        className={`item-link-btn ${item.BookId ? 'linked' : 'unlinked'}`}
                        disabled={!item.BookId}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.BookId)
                            navigate(`/livro/${item.BookId}`, {
                              state: { backUrl: location.pathname }
                            });
                        }}
                      >
                        <span className="material-symbols-rounded">auto_stories</span>
                      </button>
                    </div>
                  </div>
                  <div className="item-axis-chips">
                    {customAxes.map((axis) =>
                      item.axisValues[axis] ? (
                        <span key={axis} className="axis-chip">
                          <strong>{axis}:</strong> {item.axisValues[axis]}
                        </span>
                      ) : null
                    )}
                  </div>
                  {isMissing && (
                    <div className="item-missing-overlay">
                      <span className="material-symbols-rounded">lock</span>
                      <span>Faltante</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="legal-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="legal-modal-box collection-item-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="legal-modal-header">
              <h2 id="modal-item-title" className="legal-modal-title">
                <span className="material-symbols-rounded" aria-hidden="true">
                  {itemForm.id ? 'edit' : 'add_circle'}
                </span>
                <span>{itemForm.id ? 'Editar Item' : 'Novo Item na Coleção'}</span>
              </h2>
              <button
                type="button"
                className="legal-modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar janela"
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  close
                </span>
              </button>
            </header>

            <form onSubmit={saveItem} className="modal-form-layout" noValidate>
              <div className="legal-modal-content">
                <div className="form-group full-width">
                  <label htmlFor="item-title" className="form-label">
                    Nome do Livro / Edição *
                  </label>
                  <input
                    id="item-title"
                    type="text"
                    className="form-input"
                    required
                    value={itemForm.title}
                    onChange={(e) => handleItemFormChange('title', e.target.value)}
                    placeholder="Ex: O Sandman: Prelúdios e Noturnos - Vol. 1"
                    disabled={isSaving}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="item-status" className="form-label">
                    Status de Posse
                  </label>
                  <select
                    id="item-status"
                    className="form-select"
                    value={itemForm.status}
                    onChange={(e) => handleItemFormChange('status', e.target.value)}
                    disabled={isSaving}
                  >
                    <option value="missing">🔴 Faltante (Ainda não possuo)</option>
                    <option value="physical">🟢 Adquirido (Exemplar Físico)</option>
                    <option value="digital">🔵 Adquirido (E-book / Digital / PDF)</option>
                    <option value="both">🟡 Adquirido (Físico + Digital)</option>
                  </select>
                </div>

                {itemForm.status !== 'missing' && (
                  <div className="modal-link-block">
                    <h4 className="modal-link-header">
                      <span className="material-symbols-rounded" aria-hidden="true">
                        menu_book
                      </span>
                      <span>Vínculo com a Biblioteca Principal</span>
                    </h4>
                    <div className="modal-link-actions">
                      <div className="modal-select-wrapper">
                        <Select
                          options={libraryBooks.map((b) => ({ value: b.id, label: b.title }))}
                          value={
                            itemForm.BookId
                              ? {
                                  value: itemForm.BookId,
                                  label: libraryBooks.find((b) => b.id === itemForm.BookId)?.title
                                }
                              : null
                          }
                          onChange={(selected) => {
                            setItemForm((prev) => {
                              const newState = {
                                ...prev,
                                BookId: selected ? selected.value : null
                              };
                              if (selected && !prev.title.trim()) {
                                newState.title = selected.label;
                              }
                              return newState;
                            });
                          }}
                          isClearable
                          styles={customSelectStyles}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                          isDisabled={isSaving}
                        />
                      </div>

                      {!itemForm.BookId && (
                        <button
                          type="button"
                          className="btn-action btn-modal-create"
                          onClick={handleSilentBookCreate}
                          disabled={isCreatingBook || !itemForm.title.trim() || isSaving}
                        >
                          {isCreatingBook ? (
                            <span className="material-symbols-rounded spinner-icon">sync</span>
                          ) : (
                            <span>Criar Novo</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {customAxes.length > 0 && (
                  <div className="modal-category-block">
                    <h4 className="modal-category-header">Categorização do Item</h4>
                    <div className="modal-category-grid">
                      {customAxes.map((axis) => {
                        const existingValues = Object.keys(stats.axisStats[axis] || {})
                          .filter((val) => val !== 'Não categorizado')
                          .map((val) => ({ value: val, label: val }));

                        return (
                          <div key={axis} className="form-group full-width">
                            <label className="form-label">{axis}</label>
                            <CreatableSelect
                              isClearable
                              options={existingValues}
                              value={
                                itemForm.axisValues[axis]
                                  ? {
                                      label: itemForm.axisValues[axis],
                                      value: itemForm.axisValues[axis]
                                    }
                                  : null
                              }
                              onChange={(selected) =>
                                handleAxisChange(axis, selected ? selected.value : '')
                              }
                              styles={customSelectStyles}
                              menuPortalTarget={document.body}
                              menuPosition="fixed"
                              isDisabled={isSaving}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <footer className="legal-modal-footer">
                {itemForm.id ? (
                  <button
                    type="button"
                    className="btn-action btn-danger-outline"
                    onClick={deleteItem}
                    disabled={isSaving}
                  >
                    <span>Remover Item</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="modal-footer-actions">
                  <button
                    type="button"
                    className="btn-action btn-cancel"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                  >
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="submit"
                    className="btn-action btn-primary btn-save"
                    disabled={isSaving}
                  >
                    <span>{isSaving ? 'A Salvar...' : 'Salvar Item'}</span>
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDashboard;
