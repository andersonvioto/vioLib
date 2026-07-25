import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './GenreManager.css';

const GenreManager = () => {
  const navigate = useNavigate();

  const [genres, setGenres] = useState([]);
  const [subgenres, setSubgenres] = useState([]);

  const [addingGenre, setAddingGenre] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');

  const [addingSubFor, setAddingSubFor] = useState(null);
  const [newSubName, setNewSubName] = useState('');

  const [editingMeta, setEditingMeta] = useState(null);
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
      console.error('Erro ao buscar gêneros.', error);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleSubmitNewGenre = async (e) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    try {
      await api.post(`/attributes/genres`, { name: newGenreName });
      setAddingGenre(false);
      setNewGenreName('');
      fetchGenres();
    } catch (error) {
      console.error(error);
      alert('Erro ao adicionar gênero.');
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
      console.error(error);
      alert('Erro ao adicionar subgênero.');
    }
  };

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
      console.error(error);
      alert('Erro ao editar registro.');
    }
  };

  const handleDisable = async (type, id) => {
    if (!window.confirm(`Tem certeza que deseja excluir este item?`)) return;
    try {
      await api.delete(`/attributes/${type}/${id}`);
      fetchGenres();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir.');
    }
  };

  return (
    <div className="settings-panel">
      <header className="panel-header-clean">
        <h2 className="panel-main-title">Gerenciar Gêneros e Subgêneros</h2>
        {!addingGenre && (
          <button
            type="button"
            onClick={() => setAddingGenre(true)}
            className="btn-action btn-primary btn-add-main"
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              add
            </span>
            <span>Novo Gênero Principal</span>
          </button>
        )}
      </header>

      {addingGenre && (
        <div className="genre-card genre-card-adding">
          <form onSubmit={handleSubmitNewGenre} className="inline-edit-form">
            <input
              autoFocus
              type="text"
              value={newGenreName}
              onChange={(e) => setNewGenreName(e.target.value)}
              className="form-input inline-input"
              placeholder="Nome do gênero principal..."
            />
            <div className="inline-form-actions">
              <button type="submit" className="btn-action btn-primary btn-save-inline">
                <span>Salvar</span>
              </button>
              <button
                type="button"
                onClick={() => setAddingGenre(false)}
                className="btn-action btn-cancel-inline"
              >
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="genres-container">
        {genres.map((genre) => (
          <div key={genre.id} className="genre-card">
            <header className="genre-header">
              {editingMeta?.type === 'genres' && editingMeta?.id === genre.id ? (
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
                      onClick={() => setEditingMeta(null)}
                      className="btn-action btn-cancel-inline"
                    >
                      <span>Cancelar</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="attribute-info">
                    <h3 className="attribute-name-text">
                      <span>{genre.name}</span>
                      <button
                        type="button"
                        className="attribute-badge-link"
                        title="Ver livros deste gênero na Biblioteca"
                        onClick={() =>
                          navigate(`/biblioteca?genre=${encodeURIComponent(genre.name)}`)
                        }
                      >
                        <span>({genre.bookCount || 0})</span>
                      </button>
                    </h3>
                  </div>

                  <div className="attribute-actions">
                    <button
                      type="button"
                      onClick={() => startEditing('genres', genre.id, genre.name)}
                      className="btn-action btn-edit-taxonomy"
                      aria-label={`Editar gênero ${genre.name}`}
                    >
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisable('genres', genre.id)}
                      className="btn-action btn-delete-taxonomy"
                      aria-label={`Excluir gênero ${genre.name}`}
                    >
                      <span>Excluir</span>
                    </button>
                  </div>
                </>
              )}
            </header>

            <ul className="subgenre-list" aria-label={`Subgêneros de ${genre.name}`}>
              {subgenres
                .filter((sub) => sub.GenreId === genre.id)
                .map((subgenre) => (
                  <li key={subgenre.id} className="attribute-item sub-item">
                    {editingMeta?.type === 'subgenres' && editingMeta?.id === subgenre.id ? (
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
                            onClick={() => setEditingMeta(null)}
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
                            <span>{subgenre.name}</span>
                            <button
                              type="button"
                              className="attribute-badge-link"
                              title="Ver livros deste subgênero na Biblioteca"
                              onClick={() =>
                                navigate(
                                  `/biblioteca?genre=${encodeURIComponent(genre.name)}&subgenre=${encodeURIComponent(subgenre.name)}`
                                )
                              }
                            >
                              <span>({subgenre.bookCount || 0})</span>
                            </button>
                          </span>
                        </div>

                        <div className="attribute-actions">
                          <button
                            type="button"
                            onClick={() => startEditing('subgenres', subgenre.id, subgenre.name)}
                            className="btn-action btn-edit-taxonomy"
                            aria-label={`Editar subgênero ${subgenre.name}`}
                          >
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDisable('subgenres', subgenre.id)}
                            className="btn-action btn-delete-taxonomy"
                            aria-label={`Excluir subgênero ${subgenre.name}`}
                          >
                            <span>Excluir</span>
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}

              <li className="subgenre-action-row">
                {addingSubFor === genre.id ? (
                  <form
                    onSubmit={(e) => handleSubmitNewSubgenre(e, genre.id)}
                    className="inline-edit-form"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="form-input inline-input"
                      placeholder="Novo subgênero..."
                    />
                    <div className="inline-form-actions">
                      <button type="submit" className="btn-action btn-save-success">
                        <span>Salvar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingSubFor(null)}
                        className="btn-action btn-cancel-inline"
                      >
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingSubFor(genre.id)}
                    className="btn-action btn-add-subgenre"
                  >
                    <span className="material-symbols-rounded" aria-hidden="true">
                      add
                    </span>
                    <span>Subgênero</span>
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
