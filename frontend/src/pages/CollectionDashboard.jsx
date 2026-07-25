import { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import api from '../services/api';
import Header from '../components/Header';
import { LibraryContext } from '../contexts/LibraryContext';
import { getCoverUrl } from '../utils/bookHelpers';
import './CollectionDashboard.css';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'var(--bg-input)',
    borderColor: state.isFocused ? 'var(--accent-gold)' : 'var(--border-color)',
    boxShadow: state.isFocused ? '0 0 0 3px var(--accent-gold-glow)' : 'none',
    '&:hover': {
      borderColor: state.isFocused
        ? 'var(--accent-gold)'
        : 'var(--border-hover, rgba(255, 255, 255, 0.2))'
    },
    padding: '0px 4px',
    minHeight: '44px',
    borderRadius: 'var(--radius-sm, 6px)',
    cursor: 'text',
    transition: 'all 0.2s ease'
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md, 8px)',
    boxShadow: 'var(--shadow-float, 0 20px 25px -5px rgba(0, 0, 0, 0.6))',
    zIndex: 100,
    overflow: 'hidden'
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? 'var(--accent-gold-subtle, rgba(212, 175, 55, 0.15))'
      : 'transparent',
    color: state.isFocused ? 'var(--accent-gold)' : 'var(--text-primary)',
    cursor: 'pointer',
    padding: '10px 14px',
    fontSize: '0.9rem',
    '&:active': { backgroundColor: 'var(--accent-gold)', color: '#000000' }
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'var(--bg-elevated, #1e2736)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm, 4px)',
    margin: '2px 4px'
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'var(--text-primary)',
    fontSize: '0.85em',
    fontWeight: '500',
    padding: '2px 6px'
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '0 4px',
    borderRadius: '0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0',
    '&:hover': { backgroundColor: 'var(--text-danger, #f87171)', color: '#ffffff' }
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'var(--text-primary)',
    fontSize: '0.95rem'
  }),
  input: (provided) => ({
    ...provided,
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    margin: '0 2px'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--text-muted)',
    fontSize: '0.9rem'
  })
};

/**
 * Dashboard detalhado de uma Coleção Específica (Mural e Barras XP).
 * Orquestra catalogação de itens, filtros interativos por eixo e vínculo de acervo.
 */
const CollectionDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { currentLibrary } = useContext(LibraryContext);
  const isGuest = !!currentLibrary;

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

  const [hideMissing, setHideMissing] = useState(() => {
    return localStorage.getItem(`violib_col_hide_missing_${id}`) === 'true';
  });

  const [userSortBy, setUserSortBy] = useState(() => {
    const saved = localStorage.getItem(`violib_col_sort_multi_${id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao analisar as regras de ordenação salvas:', e);
      }
    }
    return [{ value: 'title', label: 'Título' }];
  });

  const [sortOrder, setSortOrder] = useState(
    () => localStorage.getItem(`violib_col_order_${id}`) || 'ASC'
  );

  const fetchCollection = useCallback(async () => {
    try {
      const endpoint = currentLibrary
        ? `/access/${currentLibrary.ownerId}/collections/${id}`
        : `/collections/${id}`;
      const response = await api.get(endpoint);
      setCollection(response.data);
    } catch (error) {
      console.error('Erro ao carregar coleção:', error);
      navigate('/colecoes');
    } finally {
      setIsLoading(false);
    }
  }, [id, currentLibrary, navigate]);

  const fetchLibraryBooks = useCallback(async () => {
    try {
      const response = await api.get('/books?limit=5000&sortBy=title&order=ASC');
      setLibraryBooks(response.data.books || []);
    } catch (error) {
      console.error('Erro ao carregar livros da biblioteca:', error);
    }
  }, []);

  useEffect(() => {
    fetchCollection();
    if (!isGuest) fetchLibraryBooks();
  }, [fetchCollection, fetchLibraryBooks, isGuest]);

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
      window.confirm(
        'Tem a certeza que deseja APAGAR esta coleção inteira e todos os seus itens? Os livros no seu acervo principal não serão afetados.'
      )
    ) {
      try {
        await api.delete(`/collections/${id}`);
        navigate('/colecoes');
      } catch (error) {
        console.error('Erro ao excluir coleção:', error);
        alert('Erro ao excluir coleção.');
      }
    }
  };

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
    setItemForm((prev) => ({ ...prev, axisValues: { ...prev.axisValues, [axisName]: value } }));
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
      if (finalPayload.status === 'missing') finalPayload.BookId = null;

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
        'Deseja mesmo remover este item da coleção? O livro na sua biblioteca não será apagado.'
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

  const handleBarKeyDown = (e, axis, valName, isActive) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveFilters((prev) => {
        const nextFilters = { ...prev };
        if (isActive) delete nextFilters[axis];
        else nextFilters[axis] = valName;
        return nextFilters;
      });
    }
  };

  const handleItemCardKeyDown = (e, item) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isGuest) openItemModal(item);
    }
  };

  if (isLoading || !collection) {
    return (
      <div className="dashboard-container">
        <Header />
        <div className="collections-loading" role="status" aria-live="polite">
          <span className="material-symbols-rounded spinner-icon" aria-hidden="true">
            sync
          </span>
          <span>Sincronizando o progresso da coleção...</span>
        </div>
      </div>
    );
  }

  const { stats, CollectionItems, customAxes } = collection;
  const progressStyle = { '--progress': `${stats.progress}%` };

  const filteredItems = CollectionItems.filter((item) => {
    for (const axis in activeFilters) {
      const filterValue = activeFilters[axis];
      const rawValue = item.axisValues[axis];
      const normalizedValue =
        rawValue && String(rawValue).trim() !== '' ? rawValue : 'Não categorizado';
      if (normalizedValue !== filterValue) return false;
    }
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
      if (comparisonResult !== 0) return sortOrder === 'ASC' ? comparisonResult : -comparisonResult;
    }
    if (!userSortBy.some((opt) => opt.value === 'title')) return collator.compare(a.title, b.title);
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

      <section
        className="collection-hero-banner"
        style={{
          backgroundImage: collection.bannerImage
            ? `url(${getCoverUrl(collection.bannerImage)})`
            : 'none'
        }}
        aria-label={`Resumo da coleção ${collection.title}`}
      >
        <div className="hero-gradient-overlay" aria-hidden="true"></div>

        <div className="hero-top-bar">
          <button
            type="button"
            className="btn-back-hero"
            onClick={() => navigate('/colecoes')}
            aria-label="Voltar para a lista de coleções"
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              arrow_back
            </span>
            <span>Voltar</span>
          </button>

          {!isGuest && (
            <div className="hero-owner-actions">
              <button
                type="button"
                className="btn-action hero-action-btn"
                onClick={() => navigate(`/colecoes/editar/${id}`)}
                title="Editar Coleção"
                aria-label="Editar metadados da coleção"
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  edit
                </span>
              </button>
              <button
                type="button"
                className="btn-action hero-action-btn delete-btn"
                onClick={handleDeleteCollection}
                title="Excluir Coleção"
                aria-label="Excluir coleção inteira"
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  delete
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="hero-content">
          <div className="hero-text-area">
            <h1 className="hero-title">{collection.title}</h1>
            {collection.description && <p className="hero-desc">{collection.description}</p>}
            <div className="hero-stats-pills">
              <span className="stat-pill">
                <span className="material-symbols-rounded" aria-hidden="true">
                  book
                </span>
                <span>
                  <strong>{stats.ownedItems}</strong> de {stats.totalItems} Itens Adquiridos
                </span>
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
      </section>

      {customAxes && customAxes.length > 0 && stats.totalItems > 0 && (
        <section className="xp-section" aria-label="Desempenho por categoria">
          <header className="section-header-clean">
            <div className="mural-title-wrapper">
              <span className="material-symbols-rounded section-icon" aria-hidden="true">
                analytics
              </span>
              <h2 className="section-title">Desempenho por Categoria</h2>
            </div>
            <span className="mural-hint-text">
              (Clique nas barras abaixo para combinar filtros de categorias diferentes)
            </span>
          </header>

          <div className="xp-grid">
            {customAxes.map((axis) => (
              <article key={axis} className="xp-card">
                <h3 className="xp-card-title">{axis}</h3>
                <div className="xp-bars-list" role="list" aria-label={`Valores de ${axis}`}>
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
                        aria-pressed={isActive}
                        onKeyDown={(e) => handleBarKeyDown(e, axis, valName, isActive)}
                        className={`xp-bar-container ${isActive ? 'active-filter' : ''}`}
                        onClick={() => {
                          setActiveFilters((prev) => {
                            const nextFilters = { ...prev };
                            if (isActive) delete nextFilters[axis];
                            else nextFilters[axis] = valName;
                            return nextFilters;
                          });
                        }}
                        title={
                          isActive
                            ? 'Clique para remover este filtro'
                            : 'Clique para filtrar por esta categoria'
                        }
                      >
                        <div className="xp-bar-header">
                          <span className="xp-val-name">
                            <span>{valName}</span>
                            {isActive && <span className="xp-active-badge">Ativo</span>}
                          </span>
                          <span className="xp-val-numbers">
                            <strong>{valStats.owned}</strong> / {valStats.total} ({pct}%)
                          </span>
                        </div>
                        <div className="xp-bar-track" aria-hidden="true">
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

      <section className="mural-section" aria-label="Mural de itens da coleção">
        <header className="mural-header">
          <div className="mural-header-top">
            <div className="mural-title-wrapper" style={{ flexWrap: 'wrap' }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                <span className="material-symbols-rounded section-icon" aria-hidden="true">
                  grid_view
                </span>
                <span>Mural de Coleção</span>
              </h2>

              {Object.entries(activeFilters).map(([axis, val]) => (
                <span key={axis} className="mural-active-filter">
                  <span>
                    Filtro <strong>{axis}:</strong> {val}
                  </span>
                  <button
                    type="button"
                    className="btn-remove-filter-pill"
                    onClick={() => {
                      setActiveFilters((prev) => {
                        const next = { ...prev };
                        delete next[axis];
                        return next;
                      });
                    }}
                    title="Remover este filtro"
                    aria-label={`Remover filtro ${axis}`}
                  >
                    <span className="material-symbols-rounded" aria-hidden="true">
                      cancel
                    </span>
                  </button>
                </span>
              ))}
            </div>

            {!isGuest && (
              <button
                type="button"
                className="btn-action btn-primary btn-add-item-mural"
                onClick={() => openItemModal()}
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  add
                </span>
                <span>Adicionar Item</span>
              </button>
            )}
          </div>

          {CollectionItems.length > 0 && (
            <div className="mural-toolbar" role="search" aria-label="Filtros e ordem do mural">
              <div className="mural-search">
                <span className="material-symbols-rounded search-icon" aria-hidden="true">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar item pelo nome..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="mural-search-input"
                  aria-label="Buscar item no mural pelo título"
                />
                {searchInput && (
                  <button
                    type="button"
                    className="btn-clear-mural-search"
                    onClick={() => setSearchInput('')}
                    title="Limpar busca"
                    aria-label="Limpar campo de busca"
                  >
                    <span className="material-symbols-rounded" aria-hidden="true">
                      close
                    </span>
                  </button>
                )}
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
                <span className="material-symbols-rounded sort-icon" aria-hidden="true">
                  sort
                </span>
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
                  type="button"
                  className="btn-action mural-sort-btn"
                  onClick={() => setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
                  title={sortOrder === 'ASC' ? 'Ordem Crescente' : 'Ordem Decrescente'}
                  aria-label={sortOrder === 'ASC' ? 'Ordem Crescente' : 'Ordem Decrescente'}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    {sortOrder === 'ASC' ? 'arrow_downward' : 'arrow_upward'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </header>

        {CollectionItems.length === 0 ? (
          <div className="empty-collections-state" role="status">
            <span className="material-symbols-rounded empty-icon" aria-hidden="true">
              extension_off
            </span>
            <h2>Coleção Vazia!</h2>
            <p>
              {isGuest
                ? 'Este usuário ainda não cadastrou itens a esta coleção.'
                : 'Adicione os livros e edições que fazem parte desta saga para começar a acompanhar o seu avanço.'}
            </p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="empty-collections-state" role="status">
            <span className="material-symbols-rounded empty-icon" aria-hidden="true">
              filter_list_off
            </span>
            <h2>Nenhum item encontrado</h2>
            <p>Tente limpar o campo de busca ou remover os filtros ativos para ver mais itens.</p>
            <div className="empty-actions-wrapper">
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
          </div>
        ) : (
          <div className="items-grid" role="list" aria-label="Itens catalogados na coleção">
            {sortedItems.map((item) => {
              const isMissing = item.status === 'missing';

              return (
                <div
                  key={item.id}
                  role={!isGuest ? 'button' : 'listitem'}
                  tabIndex={!isGuest ? '0' : undefined}
                  onKeyDown={(e) => handleItemCardKeyDown(e, item)}
                  className={`item-card ${isMissing ? 'status-missing' : 'status-owned'}`}
                  onClick={() => {
                    if (!isGuest) openItemModal(item);
                  }}
                  style={{ cursor: isGuest ? 'default' : 'pointer' }}
                  aria-label={`Item ${item.title}, ${isMissing ? 'faltante na coleção' : 'adquirido'}`}
                >
                  <div className="item-card-header">
                    <div className="item-header-left">
                      <span
                        className={`material-symbols-rounded item-owned-icon ${isMissing ? 'icon-placeholder' : ''}`}
                        title={!isMissing ? 'Item Adquirido' : 'Item Faltante'}
                        aria-hidden="true"
                      >
                        workspace_premium
                      </span>
                      <h4 className="item-card-title">{item.title}</h4>
                    </div>

                    <div className="item-card-actions">
                      <button
                        type="button"
                        className={`item-link-btn ${item.BookId ? 'linked' : 'unlinked'}`}
                        title={
                          item.BookId
                            ? 'Ir para o livro correspondente na Biblioteca'
                            : 'Não vinculado ao acervo principal'
                        }
                        aria-label={
                          item.BookId
                            ? `Abrir livro ${item.title} na biblioteca`
                            : 'Item sem vínculo à biblioteca'
                        }
                        disabled={!item.BookId}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.BookId) {
                            navigate(`/livro/${item.BookId}`, {
                              state: { backUrl: location.pathname }
                            });
                          }
                        }}
                      >
                        <span className="material-symbols-rounded" aria-hidden="true">
                          auto_stories
                        </span>
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
                    <div className="item-missing-overlay" aria-hidden="true">
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

      {isModalOpen && !isGuest && (
        <div
          className="legal-modal-overlay"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-item-title"
        >
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
                    <p className="modal-link-desc">
                      Conecte este item a uma obra catalogada no seu acervo geral para permitir
                      navegação rápida entre a saga e a ficha técnica do livro.
                    </p>

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
                          placeholder="Pesquise pelo nome na biblioteca..."
                          noOptionsMessage={() => 'Nenhum livro encontrado no acervo'}
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
                          title="Criar livro automaticamente na biblioteca com este título"
                        >
                          {isCreatingBook ? (
                            <span
                              className="material-symbols-rounded spinner-icon"
                              aria-hidden="true"
                            >
                              sync
                            </span>
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
                    <h4 className="modal-category-header">Categorização do Item na Saga</h4>
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
                              placeholder={`Selecione ou digite um novo...`}
                              formatCreateLabel={(inputValue) => `Criar: "${inputValue}"`}
                              noOptionsMessage={() =>
                                'Nenhuma opção cadastrada. Digite para criar.'
                              }
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
                    {isSaving ? (
                      <span className="material-symbols-rounded spinner-icon" aria-hidden="true">
                        sync
                      </span>
                    ) : (
                      <span className="material-symbols-rounded" aria-hidden="true">
                        save
                      </span>
                    )}
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
