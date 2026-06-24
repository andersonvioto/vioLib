import { useState, useEffect } from 'react';
import api from '../../services/api';

const GenreManager = () => {
  const [genres, setGenres] = useState([]);
  const [subgenres, setSubgenres] = useState([]);

  // Estados de Adição
  const [addingGenre, setAddingGenre] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  
  const [addingSubFor, setAddingSubFor] = useState(null); // Armazena o ID do gênero pai
  const [newSubName, setNewSubName] = useState('');

  // Estados de Edição (Controla qual item está sendo editado)
  const [editingMeta, setEditingMeta] = useState(null); // ex: { type: 'genres', id: 1 }
  const [editName, setEditName] = useState('');

  const fetchGenres = async () => {
    try {
      const [genresRes, subRes] = await Promise.all([
        api.get('/attributes/genres'),
        api.get('/attributes/subgenres')
      ]);
      setGenres(genresRes.data);
      setSubgenres(subRes.data);
    } catch (error) {
      console.error("Erro ao buscar gêneros.", error);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  // --- HANDLERS DE ADIÇÃO ---
  const handleSubmitNewGenre = async (e) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    try {
      await api.post(`/attributes/genres`, { name: newGenreName });
      setAddingGenre(false);
      setNewGenreName('');
      fetchGenres();
    } catch (error) {
      alert("Erro ao adicionar gênero.");
    }
  };

  const handleSubmitNewSubgenre = async (e, genreId) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    try {
      await api.post(`/attributes/subgenres`, { name: newSubName, GenreId: genreId });
      setAddingSubFor(null);
      setNewSubName('');
      fetchGenres();
    } catch (error) {
      alert("Erro ao adicionar subgênero.");
    }
  };

  // --- HANDLERS DE EDIÇÃO ---
  const startEditing = (type, id, currentName) => {
    setEditingMeta({ type, id });
    setEditName(currentName);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    
    try {
      await api.put(`/attributes/${editingMeta.type}/${editingMeta.id}`, { name: editName });
      setEditingMeta(null);
      setEditName('');
      fetchGenres();
    } catch (error) {
      alert("Erro ao editar registro.");
    }
  };

  const handleDisable = async (type, id) => {
    if (!window.confirm(`Tem certeza que deseja excluir este item?`)) return;
    try {
      await api.delete(`/attributes/${type}/${id}`);
      fetchGenres(); 
    } catch (error) {
      alert("Erro ao excluir.");
    }
  };

  return (
    <div className="settings-panel">
      <h2>Gerenciar Gêneros</h2>
      
      {!addingGenre && (
        <button onClick={() => setAddingGenre(true)} className="btn-add">
          <span className="material-symbols-rounded">add</span> Novo Gênero Principal
        </button>
      )}

      {/* Form Inline para Novo Gênero */}
      {addingGenre && (
        <div className="genre-card" style={{ borderColor: 'var(--accent-gold)' }}>
          <form onSubmit={handleSubmitNewGenre} style={{ display: 'flex', gap: '10px' }}>
            <input 
              autoFocus type="text" value={newGenreName} onChange={e => setNewGenreName(e.target.value)} 
              className="auth-input" style={{ flex: 1 }} placeholder="Nome do gênero..."
            />
            <button type="submit" className="btn-add" style={{ margin: 0 }}>Salvar</button>
            <button type="button" onClick={() => setAddingGenre(false)} className="btn-disable" style={{ margin: 0 }}>Cancelar</button>
          </form>
        </div>
      )}
      
      <div className="genres-container">
        {genres.map(genre => (
          <div key={genre.id} className="genre-card">
            
            {/* CABEÇALHO DO GÊNERO */}
            <div className="genre-header">
              {editingMeta?.type === 'genres' && editingMeta?.id === genre.id ? (
                <form onSubmit={handleSubmitEdit} style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'center' }}>
                  <input autoFocus type="text" value={editName} onChange={e => setEditName(e.target.value)} className="auth-input" style={{ flex: 1, padding: '5px 10px' }} />
                  <button type="submit" className="btn-edit" style={{ color: '#4dff4d', borderColor: '#4dff4d' }}>Salvar</button>
                  <button type="button" onClick={() => setEditingMeta(null)} className="btn-disable-small">Cancelar</button>
                </form>
              ) : (
                <>
                  <h3>{genre.name}</h3>
                  <div className="attribute-actions">
                    <button onClick={() => startEditing('genres', genre.id, genre.name)} className="btn-edit">Editar</button>
                    <button onClick={() => handleDisable('genres', genre.id)} className="btn-disable-small">Excluir</button>
                  </div>
                </>
              )}
            </div>
            
            {/* LISTA DE SUBGÊNEROS */}
            <ul className="subgenre-list">
              {subgenres.filter(sub => sub.GenreId === genre.id).map(subgenre => (
                <li key={subgenre.id} className="attribute-item sub-item">
                  {editingMeta?.type === 'subgenres' && editingMeta?.id === subgenre.id ? (
                    <form onSubmit={handleSubmitEdit} style={{ display: 'flex', gap: '10px', width: '100%' }}>
                      <input autoFocus type="text" value={editName} onChange={e => setEditName(e.target.value)} className="auth-input" style={{ flex: 1, padding: '5px' }} />
                      <button type="submit" className="btn-edit" style={{ color: '#4dff4d', borderColor: '#4dff4d' }}>Salvar</button>
                      <button type="button" onClick={() => setEditingMeta(null)} className="btn-disable-small">Cancelar</button>
                    </form>
                  ) : (
                    <>
                      <span>{subgenre.name}</span>
                      <div className="attribute-actions">
                        <button onClick={() => startEditing('subgenres', subgenre.id, subgenre.name)} className="btn-edit">Editar</button>
                        <button onClick={() => handleDisable('subgenres', subgenre.id)} className="btn-disable-small">Excluir</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
              
              {/* Form Inline ou Botão para Novo Subgênero */}
              <li style={{ marginTop: '10px' }}>
                {addingSubFor === genre.id ? (
                  <form onSubmit={(e) => handleSubmitNewSubgenre(e, genre.id)} style={{ display: 'flex', gap: '10px' }}>
                    <input autoFocus type="text" value={newSubName} onChange={e => setNewSubName(e.target.value)} className="auth-input" style={{ flex: 1, padding: '5px 10px', fontSize: '0.85rem' }} placeholder="Novo subgênero..." />
                    <button type="submit" className="btn-edit" style={{ color: '#4dff4d', borderColor: '#4dff4d' }}>Salvar</button>
                    <button type="button" onClick={() => setAddingSubFor(null)} className="btn-disable-small">Cancelar</button>
                  </form>
                ) : (
                  <button onClick={() => setAddingSubFor(genre.id)} className="btn-add" style={{ fontSize: '0.8rem', padding: '5px 10px', marginBottom: '0' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>add</span> Subgênero
                  </button>
                )}
              </li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenreManager;