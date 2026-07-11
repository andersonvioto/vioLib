import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import api from '../services/api';
import Header from '../components/Header';
import { getCoverUrl } from '../utils/bookHelpers';
import './CollectionDashboard.css';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'var(--bg-input)',
    borderColor: state.isFocused ? 'var(--accent-gold)' : 'var(--border-color)',
    boxShadow: state.isFocused ? '0 0 0 2px var(--accent-gold-glow)' : 'none',
    '&:hover': { borderColor: 'var(--accent-gold)' },
    padding: '0px',
    minHeight: '38px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'text'
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    zIndex: 100
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
    color: state.isFocused ? 'var(--accent-gold)' : 'var(--text-primary)',
    cursor: 'pointer',
    '&:active': { backgroundColor: 'var(--accent-gold)', color: '#000' }
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px'
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'var(--text-primary)',
    fontSize: '0.85em',
    fontWeight: '500'
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'var(--text-danger)', color: 'white' }
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'var(--text-primary)'
  }),
  input: (provided) => ({
    ...provided,
    color: 'var(--text-primary)'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--text-muted)'
  })
};

const CollectionDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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

  const [activeFilter, setActiveFilter] = useState(null);

  // Estados separados para o Debounce da pesquisa
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [hideMissing, setHideMissing] = useState(() => {
    return localStorage.getItem(`violib_col_hide_missing_${id}`) === 'true';
  });

  const [userSortBy, setUserSortBy] = useState(() => {
    const saved = localStorage.getItem(`violib_col_sort_multi_${id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [{ value: 'title', label: 'Título' }];
  });

  const [sortOrder, setSortOrder] = useState(
    () => localStorage.getItem(`violib_col_order_${id}`) || 'ASC'
  );

  const fetchCollection = useCallback(async () => {
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
    try {
      const response = await api.get('/books?limit=5000&sortBy=title&order=ASC');
      setLibraryBooks(response.data.books || []);
    } catch (error) {
      console.error('Erro ao carregar livros da biblioteca:', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCollection();
    fetchLibraryBooks();
  }, [fetchCollection, fetchLibraryBooks]);

  // Persistência das preferências do usuário
  useEffect(() => {
    localStorage.setItem(`violib_col_sort_multi_${id}`, JSON.stringify(userSortBy));
    localStorage.setItem(`violib_col_order_${id}`, sortOrder);
    localStorage.setItem(`violib_col_hide_missing_${id}`, hideMissing);
  }, [userSortBy, sortOrder, hideMissing, id]);

  // Lógica de Debounce para a pesquisa em memória (evita travamentos na interface)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const openItemModal = (item = null) => {
    if (item) {
      setItemForm({
        id: item.id,
        title: item.title,
        status: item.status,
        axisValues: item.axisValues || {},
        BookId: item.BookId || null
      });
    } else {
      setItemForm({ id: null, title: '', status: 'missing', axisValues: {}, BookId: null });
    }
    setIsModalOpen(true);
  };

  const handleItemFormChange = (field, value) => {
    setItemForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAxisChange = (axisName, value) => {
    setItemForm((prev) => ({
      ...prev,
      axisValues: { ...prev.axisValues, [axisName]: value }
    }));
  };

  const handleSilentBookCreate = async () => {
    if (!itemForm.title.trim()) return;

    setIsCreatingBook(true);
    try {
      const payload = new FormData();
      payload.append('title', itemForm.title);

      const response = await api.post('/books', payload);
      const newBook = response.data.book;

      setLibraryBooks((prev) => [...prev, newBook].sort((a, b) => a.title.localeCompare(b.title)));
      handleItemFormChange('BookId', newBook.id);
    } catch (error) {
      console.error('Erro na criação silenciosa do livro:', error);
      alert('Erro ao criar livro na biblioteca. Tente cadastrá-lo manualmente depois.');
    } finally {
      setIsCreatingBook(false);
    }
  };

  const saveItem = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalPayload = { ...itemForm };
      if (finalPayload.status === 'missing') {
        finalPayload.BookId = null;
      }

      if (itemForm.id) {
        await api.put(`/collections/items/${itemForm.id}`, finalPayload);
      } else {
        await api.post(`/collections/${id}/items`, finalPayload);
      }
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
    if (
      window.confirm(
        'Deseja mesmo remover este item da coleção? O livro na biblioteca não será apagado.'
      )
    ) {
      setIsSaving(true);
      try {
        await api.delete(`/collections/items/${itemForm.id}`);
        setIsModalOpen(false);
        fetchCollection();
      } catch (error) {
        console.error('Erro ao deletar item', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <Header />
        <div className="collections-loading">
          <span className="material-symbols-rounded spinner-icon">sync</span> Sincronizando o seu
          progresso...
        </div>
      </div>
    );
  }

  const { stats, CollectionItems, customAxes } = collection;
  const progressStyle = { '--progress': `${stats.progress}%` };

  const filteredItems = CollectionItems.filter((item) => {
    if (activeFilter && item.axisValues[activeFilter.axis] !== activeFilter.value) return false;
    if (hideMissing && item.status === 'missing') return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

    for (const sortOption of userSortBy) {
      const criteria = sortOption.value;
      let valA, valB;

      if (criteria === 'title') {
        valA = a.title;
        valB = b.title;
      } else if (criteria === 'status') {
        const statusWeight = { both: 3, physical: 2, digital: 1, missing: 0 };
        valA = (statusWeight[a.status] || 0).toString();
        valB = (statusWeight[b.status] || 0).toString();
      } else {
        valA = a.axisValues[criteria] || '';
        valB = b.axisValues[criteria] || '';
      }

      const comparisonResult = collator.compare(valA, valB);
      if (comparisonResult !== 0) {
        return sortOrder === 'ASC' ? comparisonResult : -comparisonResult;
      }
    }

    if (!userSortBy.some((opt) => opt.value === 'title')) {
      return collator.compare(a.title, b.title);
    }
    return 0;
  });

  const sortOptions = [
    { value: 'title', label: 'Título' },
    { value: 'status', label: 'Status de Posse' },
    ...(customAxes || []).map((axis) => ({ value: axis, label: axis }))
  ];

  return (
    <div className="dashboard-container">
      <Header />

      <div
        className="collection-hero-banner"
        style={{
          backgroundImage: collection.bannerImage
            ? `url(${getCoverUrl(collection.bannerImage)})`
            : 'none'
        }}
      >
        <div className="hero-gradient-overlay"></div>
        <button className="btn-back-hero" onClick={() => navigate('/colecoes')}>
          <span className="material-symbols-rounded">arrow_back</span> Voltar
        </button>

        <div className="hero-content">
          <div className="hero-text-area">
            <h1 className="hero-title">{collection.title}</h1>
            {collection.description && <p className="hero-desc">{collection.description}</p>}
            <div className="hero-stats-pills">
              <span className="stat-pill">
                <span className="material-symbols-rounded">book</span> {stats.ownedItems} de{' '}
                {stats.totalItems} Adquiridos
              </span>
            </div>
          </div>

          <div className="hero-progress-ring" style={progressStyle}>
            <div className="hero-progress-inner">
              <span className="hero-progress-value">{stats.progress}%</span>
              <span className="hero-progress-label">Concluído</span>
            </div>
          </div>
        </div>
      </div>

      {customAxes && customAxes.length > 0 && stats.totalItems > 0 && (
        <div className="xp-section">
          <h2 className="section-title mural-title-wrapper">
            <span className="material-symbols-rounded">analytics</span> Desempenho por Categoria
            <span className="mural-hint-text">(Clique numa barra para filtrar o mural)</span>
          </h2>
          <div className="xp-grid">
            {customAxes.map((axis) => (
              <div key={axis} className="xp-card">
                <h3 className="xp-card-title">{axis}</h3>
                <div className="xp-bars-list">
                  {Object.entries(stats.axisStats[axis] || {}).map(([valName, valStats]) => {
                    const pct =
                      valStats.total === 0
                        ? 0
                        : Math.round((valStats.owned / valStats.total) * 100);
                    const isActive = activeFilter?.axis === axis && activeFilter?.value === valName;

                    return (
                      <div
                        key={valName}
                        className={`xp-bar-container ${isActive ? 'active-filter' : ''}`}
                        onClick={() => {
                          if (isActive) setActiveFilter(null);
                          else setActiveFilter({ axis, value: valName });
                        }}
                        title={isActive ? 'Remover filtro' : `Filtrar itens por ${valName}`}
                      >
                        <div className="xp-bar-header">
                          <span className="xp-val-name">{valName}</span>
                          <span className="xp-val-numbers">
                            {valStats.owned} / {valStats.total} ({pct}%)
                          </span>
                        </div>
                        <div className="xp-bar-track">
                          <div className="xp-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mural-section">
        <div className="mural-header">
          <div className="mural-header-top">
            <div className="mural-title-wrapper">
              <h2 className="section-title" style={{ margin: 0 }}>
                <span className="material-symbols-rounded">grid_view</span> Mural de Coleção
              </h2>
              {activeFilter && (
                <span className="mural-active-filter">
                  Filtro XP: {activeFilter.value}
                  <span className="material-symbols-rounded" onClick={() => setActiveFilter(null)}>
                    cancel
                  </span>
                </span>
              )}
            </div>

            <button className="btn-action btn-primary" onClick={() => openItemModal()}>
              <span className="material-symbols-rounded">add</span> Adicionar Item
            </button>
          </div>

          {CollectionItems.length > 0 && (
            <div className="mural-toolbar">
              <div className="mural-search">
                <span className="material-symbols-rounded">search</span>
                <input
                  type="text"
                  placeholder="Buscar pelo nome..."
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
                Ocultar Faltantes
              </label>

              <div className="mural-sort">
                <span className="material-symbols-rounded">sort</span>
                <div className="mural-sort-select">
                  <Select
                    isMulti
                    options={sortOptions}
                    value={userSortBy}
                    onChange={(selected) => setUserSortBy(selected || [])}
                    styles={customSelectStyles}
                    placeholder="Regras de ordem..."
                    noOptionsMessage={() => 'Sem mais regras'}
                  />
                </div>
                <button
                  className="btn-action mural-sort-btn"
                  onClick={() => setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
                  title={sortOrder === 'ASC' ? 'Ordem Crescente' : 'Ordem Decrescente'}
                >
                  <span className="material-symbols-rounded">
                    {sortOrder === 'ASC' ? 'arrow_downward' : 'arrow_upward'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {CollectionItems.length === 0 ? (
          <div className="empty-collections-state">
            <span className="material-symbols-rounded empty-icon">extension_off</span>
            <h2>Coleção Vazia!</h2>
            <p>
              Adicione os livros que fazem parte desta coleção para começar a acompanhar o seu
              progresso.
            </p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="empty-collections-state">
            <span className="material-symbols-rounded empty-icon">filter_list_off</span>
            <h2>Nenhum item encontrado</h2>
            <p>Tente limpar o campo de busca ou remover os filtros ativos para ver mais itens.</p>
            <button
              className="btn-action btn-empty-clear"
              onClick={() => {
                setActiveFilter(null);
                setSearchInput('');
                setSearchQuery('');
                setHideMissing(false);
              }}
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="items-grid">
            {sortedItems.map((item) => {
              const isMissing = item.status === 'missing';
              return (
                <div
                  key={item.id}
                  className={`item-card ${isMissing ? 'status-missing' : 'status-owned'}`}
                  onClick={() => openItemModal(item)}
                >
                  <div className="item-card-header">
                    <h4 className="item-card-title">{item.title}</h4>

                    <div className="item-card-actions">
                      {item.BookId && (
                        <span
                          className="material-symbols-rounded item-link-icon"
                          title="Ir para o Livro na Biblioteca"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/livro/${item.BookId}`);
                          }}
                        >
                          auto_stories
                        </span>
                      )}
                      {!isMissing && (
                        <span
                          className="material-symbols-rounded item-owned-icon"
                          title="Adquirido"
                        >
                          workspace_premium
                        </span>
                      )}
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
                      <span className="material-symbols-rounded">lock</span> Faltante
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="legal-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="legal-modal-box collection-item-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="legal-modal-header">
              <h2 className="legal-modal-title">
                <span className="material-symbols-rounded">
                  {itemForm.id ? 'edit' : 'add_circle'}
                </span>
                {itemForm.id ? 'Editar Item' : 'Novo Item na Coleção'}
              </h2>
              <button
                type="button"
                className="legal-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </header>

            <form onSubmit={saveItem} className="modal-form-layout">
              <div className="legal-modal-content">
                <div className="form-group full-width">
                  <label className="form-label">Nome do Livro/Item *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={itemForm.title}
                    onChange={(e) => handleItemFormChange('title', e.target.value)}
                    placeholder="Ex: Way of the Dragon"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Status de Posse</label>
                  <select
                    className="form-select"
                    value={itemForm.status}
                    onChange={(e) => handleItemFormChange('status', e.target.value)}
                  >
                    <option value="missing">🔴 Faltante (Não Possuo)</option>
                    <option value="physical">🟢 Adquirido (Físico)</option>
                    <option value="digital">🔵 Adquirido (Digital / PDF)</option>
                    <option value="both">🟡 Adquirido (Físico + Digital)</option>
                  </select>
                </div>

                {itemForm.status !== 'missing' && (
                  <div className="modal-link-block">
                    <h4 className="modal-link-header">
                      <span className="material-symbols-rounded">menu_book</span> Vínculo com a
                      Biblioteca (Opcional)
                    </h4>
                    <p className="modal-link-desc">
                      Conecte este item a um livro real do seu acervo principal para acesso rápido.
                    </p>

                    <div className="modal-link-actions">
                      <div style={{ flex: 1 }}>
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
                          onChange={(selected) =>
                            handleItemFormChange('BookId', selected ? selected.value : null)
                          }
                          isClearable
                          placeholder="Pesquise pelo nome do livro..."
                          noOptionsMessage={() => 'Nenhum livro encontrado'}
                          styles={customSelectStyles}
                        />
                      </div>

                      {!itemForm.BookId && (
                        <button
                          type="button"
                          className="btn-action btn-modal-create"
                          onClick={handleSilentBookCreate}
                          disabled={isCreatingBook || !itemForm.title.trim()}
                          title="Cria automaticamente um livro com este nome na sua biblioteca"
                        >
                          {isCreatingBook ? (
                            <span className="material-symbols-rounded spinner-icon">sync</span>
                          ) : (
                            'Criar Novo'
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
                      {customAxes.map((axis) => (
                        <div key={axis} className="form-group full-width">
                          <label className="form-label">{axis}</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={`Ex: Valor para ${axis}`}
                            value={itemForm.axisValues[axis] || ''}
                            onChange={(e) => handleAxisChange(axis, e.target.value)}
                          />
                        </div>
                      ))}
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
                    Remover
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="modal-footer-actions">
                  <button
                    type="button"
                    className="btn-action"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-action btn-primary" disabled={isSaving}>
                    {isSaving ? 'A Salvar...' : 'Salvar Item'}
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
