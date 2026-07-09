import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import api from '../services/api';
import Header from '../components/Header';
import { getCoverUrl } from '../utils/bookHelpers';
import './CollectionDashboard.css';

// Estilos personalizados para o Select de pesquisa
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'var(--bg-input)',
    borderColor: state.isFocused ? 'var(--accent-gold)' : 'var(--border-color)',
    boxShadow: state.isFocused ? '0 0 0 2px var(--accent-gold-glow)' : 'none',
    '&:hover': { borderColor: 'var(--accent-gold)' },
    padding: '2px',
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
  
  // Lista de livros da biblioteca do usuário para o Dropdown de Vínculo
  const [libraryBooks, setLibraryBooks] = useState([]);
  
  // Estados do Modal de Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [itemForm, setItemForm] = useState({ id: null, title: '', status: 'missing', axisValues: {}, BookId: null });

  // NOVO: Estado para gerir o Filtro Interativo do Mural
  const [activeFilter, setActiveFilter] = useState(null);

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
    fetchCollection();
    fetchLibraryBooks();
  }, [fetchCollection, fetchLibraryBooks]);

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
    setItemForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAxisChange = (axisName, value) => {
    setItemForm(prev => ({
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
      
      setLibraryBooks(prev => [...prev, newBook].sort((a, b) => a.title.localeCompare(b.title)));
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
    if (window.confirm('Deseja mesmo remover este item da coleção? O livro na biblioteca não será apagado.')) {
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
          <span className="material-symbols-rounded spinner-icon">sync</span> Sincronizando o seu progresso...
        </div>
      </div>
    );
  }

  const { stats, CollectionItems, customAxes } = collection;
  const progressStyle = { '--progress': `${stats.progress}%` };

  // NOVO: Aplica o filtro aos itens do Mural
  const filteredItems = activeFilter 
    ? CollectionItems.filter(item => item.axisValues[activeFilter.axis] === activeFilter.value)
    : CollectionItems;

  return (
    <div className="dashboard-container">
      <Header />
      
      {/* 1. HERO BANNER GIGANTE */}
      <div 
        className="collection-hero-banner" 
        style={{ backgroundImage: collection.bannerImage ? `url(${getCoverUrl(collection.bannerImage)})` : 'none' }}
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
              <span className="stat-pill"><span className="material-symbols-rounded">book</span> {stats.ownedItems} de {stats.totalItems} Adquiridos</span>
            </div>
          </div>
          
          {/* O Grande Anel de Maestria */}
          <div className="hero-progress-ring" style={progressStyle}>
            <div className="hero-progress-inner">
              <span className="hero-progress-value">{stats.progress}%</span>
              <span className="hero-progress-label">Concluído</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BARRAS DE EXPERIÊNCIA (XP BARS) DOS EIXOS DINÂMICOS */}
      {customAxes && customAxes.length > 0 && stats.totalItems > 0 && (
        <div className="xp-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">analytics</span> Desempenho por Categoria
            <span style={{ fontSize: '0.6em', color: 'var(--text-muted)', marginLeft: '10px', fontWeight: 'normal' }}>
              (Clique numa barra para filtrar o mural)
            </span>
          </h2>
          <div className="xp-grid">
            {customAxes.map(axis => (
              <div key={axis} className="xp-card">
                <h3 className="xp-card-title">{axis}</h3>
                <div className="xp-bars-list">
                  {Object.entries(stats.axisStats[axis] || {}).map(([valName, valStats]) => {
                    const pct = valStats.total === 0 ? 0 : Math.round((valStats.owned / valStats.total) * 100);
                    const isActive = activeFilter?.axis === axis && activeFilter?.value === valName;

                    return (
                      <div 
                        key={valName} 
                        className={`xp-bar-container ${isActive ? 'active-filter' : ''}`}
                        onClick={() => {
                          if (isActive) setActiveFilter(null);
                          else setActiveFilter({ axis, value: valName });
                        }}
                        title={isActive ? "Remover filtro" : `Filtrar itens por ${valName}`}
                      >
                        <div className="xp-bar-header">
                          <span className="xp-val-name">{valName}</span>
                          <span className="xp-val-numbers">{valStats.owned} / {valStats.total} ({pct}%)</span>
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

      {/* 3. MURAL DE TROFÉUS (GRELHA DE ITENS) */}
      <div className="mural-section">
        <div className="mural-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 className="section-title" style={{ margin: 0 }}><span className="material-symbols-rounded">grid_view</span> Mural de Coleção</h2>
            
            {/* NOVO: Badge visual indicando o filtro ativo */}
            {activeFilter && (
              <span style={{ 
                fontSize: '0.85em', 
                color: 'var(--accent-gold)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                padding: '4px 12px', 
                background: 'var(--accent-gold-glow)', 
                borderRadius: '20px', 
                border: '1px solid var(--accent-gold)' 
              }}>
                Filtrado por: <strong>{activeFilter.axis} = {activeFilter.value}</strong>
                <span 
                  className="material-symbols-rounded" 
                  style={{ fontSize: '1.2em', cursor: 'pointer' }}
                  onClick={() => setActiveFilter(null)}
                  title="Remover filtro"
                >
                  cancel
                </span>
              </span>
            )}
          </div>
          
          <button className="btn-action btn-primary" onClick={() => openItemModal()}>
            <span className="material-symbols-rounded">add</span> Adicionar Item
          </button>
        </div>

        {CollectionItems.length === 0 ? (
          <div className="empty-collections-state">
            <span className="material-symbols-rounded empty-icon">extension_off</span>
            <h2>Coleção Vazia!</h2>
            <p>Adicione os livros que fazem parte desta coleção para começar a acompanhar o seu progresso.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          // NOVO: Mensagem de erro amigável se o filtro não retornar resultados
          <div className="empty-collections-state">
            <span className="material-symbols-rounded empty-icon">filter_list_off</span>
            <h2>Nenhum item encontrado</h2>
            <p>Não existem itens nesta coleção com o filtro <strong>{activeFilter.axis}: {activeFilter.value}</strong>.</p>
            <button className="btn-action" onClick={() => setActiveFilter(null)} style={{ margin: '0 auto' }}>
              Remover Filtro
            </button>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map(item => {
              const isMissing = item.status === 'missing';
              return (
                <div 
                  key={item.id} 
                  className={`item-card ${isMissing ? 'status-missing' : 'status-owned'}`}
                  onClick={() => openItemModal(item)}
                >
                  <div className="item-card-header">
                    <h4 className="item-card-title">{item.title}</h4>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {item.BookId && (
                        <span 
                          className="material-symbols-rounded" 
                          style={{ color: 'var(--text-secondary)', cursor: 'pointer', transition: '0.2s' }}
                          title="Ir para o Livro na Biblioteca"
                          onClick={(e) => {
                            e.stopPropagation(); 
                            navigate(`/livro/${item.BookId}`);
                          }}
                          onMouseOver={(e) => e.target.style.color = 'var(--accent-gold)'}
                          onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
                        >
                          auto_stories
                        </span>
                      )}
                      {!isMissing && (
                        <span className="material-symbols-rounded item-owned-icon" title="Adquirido">
                          workspace_premium
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="item-axis-chips">
                    {customAxes.map(axis => (
                      item.axisValues[axis] ? (
                        <span key={axis} className="axis-chip">
                          <strong>{axis}:</strong> {item.axisValues[axis]}
                        </span>
                      ) : null
                    ))}
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

      {/* 4. MODAL DE CRIAÇÃO/EDIÇÃO DE ITEM */}
      {isModalOpen && (
        <div className="legal-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="legal-modal-box" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <header className="legal-modal-header">
              <h2 className="legal-modal-title">
                <span className="material-symbols-rounded">{itemForm.id ? 'edit' : 'add_circle'}</span>
                {itemForm.id ? 'Editar Item' : 'Novo Item na Coleção'}
              </h2>
              <button type="button" className="legal-modal-close" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </header>
            
            <form onSubmit={saveItem} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="legal-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-group full-width">
                  <label className="form-label">Nome do Livro/Item *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={itemForm.title} 
                    onChange={e => handleItemFormChange('title', e.target.value)} 
                    placeholder="Ex: Way of the Dragon"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Status de Posse</label>
                  <select className="form-select" value={itemForm.status} onChange={e => handleItemFormChange('status', e.target.value)}>
                    <option value="missing">🔴 Faltante (Não Possuo)</option>
                    <option value="physical">🟢 Adquirido (Físico)</option>
                    <option value="digital">🔵 Adquirido (Digital / PDF)</option>
                    <option value="both">🟡 Adquirido (Físico + Digital)</option>
                  </select>
                </div>

                {itemForm.status !== 'missing' && (
                  <div style={{ padding: '15px', background: 'var(--accent-gold-glow)', borderRadius: '8px', border: '1px solid var(--accent-gold)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9em', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: '1.2em' }}>menu_book</span> Vínculo com a Biblioteca (Opcional)
                    </h4>
                    <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Conecte este item a um livro real do seu acervo principal para acesso rápido.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <Select 
                          options={libraryBooks.map(b => ({ value: b.id, label: b.title }))}
                          value={itemForm.BookId ? { value: itemForm.BookId, label: libraryBooks.find(b => b.id === itemForm.BookId)?.title } : null}
                          onChange={selected => handleItemFormChange('BookId', selected ? selected.value : null)}
                          isClearable
                          placeholder="Pesquise pelo nome do livro..."
                          noOptionsMessage={() => "Nenhum livro encontrado"}
                          styles={customSelectStyles}
                        />
                      </div>

                      {!itemForm.BookId && (
                        <button 
                          type="button" 
                          className="btn-action" 
                          onClick={handleSilentBookCreate}
                          disabled={isCreatingBook || !itemForm.title.trim()}
                          title="Cria automaticamente um livro com este nome na sua biblioteca"
                          style={{ whiteSpace: 'nowrap', padding: '8px 12px', fontSize: '0.9em' }}
                        >
                          {isCreatingBook ? (
                            <span className="material-symbols-rounded spinner-icon" style={{ animation: 'authSpin 1s linear infinite reverse' }}>sync</span>
                          ) : 'Criar Novo'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {customAxes.length > 0 && (
                  <div style={{ padding: '15px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9em', color: 'var(--text-primary)' }}>Categorização do Item</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      {customAxes.map(axis => (
                        <div key={axis} className="form-group full-width">
                          <label className="form-label" style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>{axis}</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder={`Ex: Valor para ${axis}`}
                            value={itemForm.axisValues[axis] || ''} 
                            onChange={e => handleAxisChange(axis, e.target.value)} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <footer className="legal-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px' }}>
                {itemForm.id ? (
                  <button type="button" className="btn-action" style={{ color: 'var(--text-danger)', borderColor: 'var(--text-danger)' }} onClick={deleteItem} disabled={isSaving}>
                    Remover
                  </button>
                ) : <div></div>}
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn-action" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</button>
                  <button type="submit" className="btn-action btn-primary" disabled={isSaving}>{isSaving ? 'A Salvar...' : 'Salvar Item'}</button>
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