import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './BookForm.css'; // Reutilizamos os estilos base dos formulários da aplicação

const CollectionForm = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Dados básicos
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Imagem de Banner
  const [bannerFile, setBannerFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Eixos Dinâmicos (Array de strings)
  const [axes, setAxes] = useState([]);
  const [newAxisInput, setNewAxisInput] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddAxis = () => {
    const trimmed = newAxisInput.trim();
    if (!trimmed) return;

    if (axes.includes(trimmed)) {
      setFeedback({ type: 'error', message: 'Este eixo já foi adicionado.' });
      return;
    }

    if (axes.length >= 4) {
      setFeedback({ type: 'error', message: 'O limite máximo é de 4 eixos de agrupamento.' });
      return;
    }

    setAxes([...axes, trimmed]);
    setNewAxisInput('');
    setFeedback({ type: '', message: '' });
  };

  const handleRemoveAxis = (axisToRemove) => {
    setAxes(axes.filter((a) => a !== axisToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      return setFeedback({ type: 'error', message: 'O título é obrigatório.' });
    }

    setIsSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const payloadForm = new FormData();
      payloadForm.append('title', title);
      payloadForm.append('description', description);
      payloadForm.append('customAxes', JSON.stringify(axes));

      if (bannerFile) {
        payloadForm.append('bannerImage', bannerFile);
      }

      await api.post('/collections', payloadForm);
      navigate('/colecoes'); // Redireciona para o Mural de Troféus
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.error || 'Erro ao criar coleção.'
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="form-container">
      <header className="form-header">
        <span
          className="material-symbols-rounded"
          style={{ fontSize: '2.5em', color: 'var(--accent-gold)' }}
        >
          library_books
        </span>
        <h1 className="form-title">Criar Nova Coleção</h1>
      </header>

      {feedback.message && (
        <div className={`feedback-banner ${feedback.type}`}>
          <span className="material-symbols-rounded">
            {feedback.type === 'error' ? 'error' : 'info'}
          </span>
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* SESSÃO 1: CAPA/BANNER */}
        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">wallpaper</span> Imagem de Fundo (Banner)
          </h2>
          <div className="cover-upload-area" style={{ padding: '20px' }}>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Banner Preview"
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}
              />
            )}
            <label className="btn-action btn-cover-option">
              <span className="material-symbols-rounded">add_photo_alternate</span>
              {previewUrl ? 'Trocar Imagem' : 'Escolher Imagem (Recomendado: Paisagem)'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input-hidden"
              />
            </label>
          </div>
        </div>

        {/* SESSÃO 2: DADOS BÁSICOS */}
        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">info</span> Informações Básicas
          </h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Nome da Coleção (ex: Absolute Sandman) *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group full-width">
              <label className="form-label">Descrição (Opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                placeholder="O que está a colecionar?"
                style={{ minHeight: '80px' }}
              />
            </div>
          </div>
        </div>

        {/* SESSÃO 3: EIXOS DINÂMICOS (A GRANDE INOVAÇÃO) */}
        <div className="form-section">
          <h2 className="section-title" style={{ marginBottom: '5px' }}>
            <span className="material-symbols-rounded">category</span> Eixos de Agrupamento
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9em',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}
          >
            Como quer organizar e ver o progresso desta coleção? Crie até 4 categorias
            personalizadas (ex: Edição, Arco, Saga).
          </p>

          <div className="isbn-wrapper" style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={newAxisInput}
              onChange={(e) => setNewAxisInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAxis();
                }
              }}
              className="form-input"
              placeholder="Nome da Categoria (ex: Edição)"
              disabled={axes.length >= 4}
            />
            <button
              type="button"
              className="btn-action btn-primary"
              onClick={handleAddAxis}
              disabled={axes.length >= 4 || !newAxisInput.trim()}
            >
              <span className="material-symbols-rounded">add</span> Adicionar Eixo
            </button>
          </div>

          {/* Área visual das Tags criadas */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {axes.map((axis) => (
              <div
                key={axis}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-input)',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: '1px solid var(--accent-gold)'
                }}
              >
                <span style={{ fontWeight: '500' }}>{axis}</span>
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: '1.2em', cursor: 'pointer', color: 'var(--text-danger)' }}
                  onClick={() => handleRemoveAxis(axis)}
                  title="Remover"
                >
                  cancel
                </span>
              </div>
            ))}
            {axes.length === 0 && (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Nenhum eixo criado. Os seus itens não serão agrupados.
              </span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-action"
            style={{ border: 'none', color: 'var(--text-secondary)' }}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-action btn-primary" disabled={isSaving}>
            {isSaving ? 'A Guardar...' : 'Guardar Nova Coleção'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CollectionForm;
