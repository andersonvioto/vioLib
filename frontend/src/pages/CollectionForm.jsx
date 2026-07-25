import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { getCoverUrl } from '../utils/bookHelpers';
import './CollectionForm.css';

/**
 * Componente do formulário de criação e edição de Coleções e Sagas.
 * Permite definir título, descrição, banner de fundo e até 4 eixos de categorização.
 */
const CollectionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [bannerFile, setBannerFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [axes, setAxes] = useState([]);
  const [newAxisInput, setNewAxisInput] = useState('');

  useEffect(() => {
    if (isEditMode) {
      api
        .get(`/collections/${id}`)
        .then((res) => {
          const col = res.data;
          setTitle(col.title);
          setDescription(col.description || '');
          setAxes(col.customAxes || []);
          if (col.bannerImage) setPreviewUrl(getCoverUrl(col.bannerImage));
        })
        .catch((err) => {
          console.error(err);
          navigate('/colecoes');
        });
    }
  }, [id, isEditMode, navigate]);

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
      setFeedback({ type: 'error', message: 'Este eixo de categorização já foi adicionado.' });
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
      return setFeedback({ type: 'error', message: 'O título da coleção é obrigatório.' });
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

      if (isEditMode) {
        await api.put(`/collections/${id}`, payloadForm);
      } else {
        await api.post('/collections', payloadForm);
      }

      navigate('/colecoes');
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.error || 'Erro ao salvar coleção.'
      });
      setIsSaving(false);
    }
  };

  const handleAxisKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAxis();
    }
  };

  return (
    <div className="collection-form-container">
      <header className="collection-form-header">
        <span className="material-symbols-rounded form-header-icon" aria-hidden="true">
          {isEditMode ? 'edit_document' : 'library_books'}
        </span>
        <div className="form-header-text">
          <h1 className="form-title">{isEditMode ? 'Editar Coleção' : 'Criar Nova Coleção'}</h1>
          <p className="form-subtitle">
            Defina a identidade visual, o objetivo da sua saga e os eixos personalizados para
            catalogação.
          </p>
        </div>
      </header>

      {feedback.message && (
        <div className={`feedback-banner ${feedback.type}`} role="alert">
          <span className="material-symbols-rounded" aria-hidden="true">
            {feedback.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="collection-form-layout" noValidate>
        <section className="form-section" aria-label="Imagem de Fundo e Identidade">
          <h2 className="section-title">
            <div className="section-title-left">
              <span className="material-symbols-rounded" aria-hidden="true">
                wallpaper
              </span>
              <span>Imagem de Fundo (Banner)</span>
            </div>
            <span className="section-optional-pill">Opcional</span>
          </h2>

          <div className="banner-upload-area">
            {previewUrl ? (
              <div className="banner-preview-box">
                <img
                  src={previewUrl}
                  alt="Preview do Banner da Coleção"
                  className="banner-img-preview"
                />
              </div>
            ) : (
              <div className="banner-dropzone-empty">
                <span className="material-symbols-rounded dropzone-icon" aria-hidden="true">
                  landscape
                </span>
                <span className="dropzone-text">
                  Nenhuma imagem selecionada. Escolha uma paisagem ou arte marcante para o topo da
                  saga.
                </span>
              </div>
            )}

            <label className="btn-action btn-banner-select">
              <span className="material-symbols-rounded" aria-hidden="true">
                add_photo_alternate
              </span>
              <span>
                {previewUrl ? 'Trocar Imagem de Fundo' : 'Escolher Imagem (Recomendado: Paisagem)'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input-hidden"
                disabled={isSaving}
              />
            </label>
          </div>
        </section>

        <section className="form-section" aria-label="Informações Básicas da Saga">
          <h2 className="section-title">
            <div className="section-title-left">
              <span className="material-symbols-rounded" aria-hidden="true">
                info
              </span>
              <span>Informações Básicas</span>
            </div>
          </h2>

          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="col-title" className="form-label">
                <div className="label-main-text">
                  <span>Nome da Coleção (ex: Absolute Sandman, Universo Tolkien)</span>
                </div>
                <span className="label-required-badge">Obrigatório</span>
              </label>
              <input
                id="col-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input input-required-highlight"
                placeholder="Digite o título principal da coleção..."
                required
                disabled={isSaving}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="col-desc" className="form-label">
                <div className="label-main-text">
                  <span>Descrição e Metas de Leitura</span>
                </div>
                <span className="label-optional-text">(Opcional)</span>
              </label>
              <textarea
                id="col-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                placeholder="O que você está colecionando? Escreva sobre a história, objetivo ou edições que compõem este álbum..."
                disabled={isSaving}
              />
            </div>
          </div>
        </section>

        <section className="form-section" aria-label="Eixos Personalizados de Agrupamento">
          <h2 className="section-title">
            <div className="section-title-left">
              <span className="material-symbols-rounded" aria-hidden="true">
                category
              </span>
              <span>Eixos de Agrupamento</span>
            </div>
            <span className="section-optional-pill">Até 4 Eixos</span>
          </h2>

          <p className="section-helper-desc">
            Como você quer catalogar os itens dentro desta saga? Crie categorias personalizadas como{' '}
            <strong>&quot;Edição&quot;</strong>, <strong>&quot;Arco&quot;</strong>,{' '}
            <strong>&quot;Formato&quot;</strong> ou <strong>&quot;Fase&quot;</strong> para gerar
            filtros e gráficos automáticos no mural.
          </p>

          <div className="axis-creation-toolbar" role="search">
            <input
              type="text"
              value={newAxisInput}
              onChange={(e) => setNewAxisInput(e.target.value)}
              onKeyDown={handleAxisKeyDown}
              className="axis-input-clean"
              placeholder={
                axes.length >= 4
                  ? 'Limite de 4 eixos atingido'
                  : 'Nome do eixo (ex: Formato, Volume)...'
              }
              disabled={axes.length >= 4 || isSaving}
              aria-label="Digitar nome de um novo eixo de categorização"
            />
            <button
              type="button"
              className="btn-action btn-primary btn-add-axis"
              onClick={handleAddAxis}
              disabled={axes.length >= 4 || !newAxisInput.trim() || isSaving}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                add
              </span>
              <span>Adicionar Eixo</span>
            </button>
          </div>

          <div
            className="axis-pills-container"
            role="list"
            aria-label="Eixos cadastrados para a coleção"
          >
            {axes.map((axis) => (
              <div key={axis} className="axis-tag-pill" role="listitem">
                <span className="axis-name">{axis}</span>
                <button
                  type="button"
                  className="btn-remove-axis"
                  onClick={() => handleRemoveAxis(axis)}
                  title={`Remover eixo ${axis}`}
                  aria-label={`Remover eixo ${axis}`}
                  disabled={isSaving}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    cancel
                  </span>
                </button>
              </div>
            ))}

            {axes.length === 0 && (
              <div className="empty-axes-hint" role="status">
                <span>
                  Nenhum eixo personalizado adicionado. Os seus itens serão listados sem subgrupos.
                </span>
              </div>
            )}
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-action btn-cancel"
            disabled={isSaving}
          >
            <span>Cancelar</span>
          </button>
          <button type="submit" className="btn-action btn-primary btn-save" disabled={isSaving}>
            {isSaving ? (
              <span className="material-symbols-rounded spinner-icon" aria-hidden="true">
                sync
              </span>
            ) : (
              <span className="material-symbols-rounded" aria-hidden="true">
                save
              </span>
            )}
            <span>
              {isSaving ? 'A Guardar...' : isEditMode ? 'Guardar Edição' : 'Guardar Nova Coleção'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CollectionForm;
