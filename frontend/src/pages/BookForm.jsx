import { useTranslation } from 'react-i18next';
import CreatableSelect from 'react-select/creatable';
import BarcodeScanner from '../components/BarcodeScanner';
import ImageCropperModal from '../components/ImageCropperModal';
import useBookFormLogic from '../hooks/useBookFormLogic';
import useNetworkStatus from '../hooks/useNetworkStatus';
import './BookForm.css';

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
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'var(--border-color)',
    borderRadius: '4px'
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'var(--text-primary)'
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'var(--text-danger)', color: 'white' }
  }),
  input: (provided) => ({
    ...provided,
    color: 'var(--text-primary)'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--text-muted)'
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'var(--text-primary)'
  })
};

/**
 * Componente do formulário de criação e edição de livros.
 * Integrado com sensor de rede para bloquear buscas externas (Amazon/ISBN) quando offline.
 */
const BookForm = () => {
  const { t } = useTranslation();
  const isOnline = useNetworkStatus();

  const {
    navigate,
    isEditMode,
    formData,
    setFormData,
    availableGenres,
    availableSubgenres,
    availableAuthors,
    availableTranslators,
    previewUrl,
    isLoadingIsbn,
    isSaving,
    feedback,
    isScannerOpen,
    setIsScannerOpen,
    handleChange,
    handleFileChange,
    handleScanSuccess,
    handleIsbnSearch,
    handleSubmit,
    amazonUrl,
    setAmazonUrl,
    isLoadingAmazon,
    handleAmazonImport,
    imageSrcForCrop,
    handleCropComplete,
    handleCropCancel
  } = useBookFormLogic();

  return (
    <div className="form-container">
      {imageSrcForCrop && (
        <ImageCropperModal
          imageSrc={imageSrcForCrop}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <header className="form-header">
        <span
          className="material-symbols-rounded"
          style={{ fontSize: '2.5em', color: 'var(--accent-gold)' }}
        >
          {isEditMode ? 'edit_document' : 'library_add'}
        </span>
        <h1 className="form-title">{isEditMode ? 'Editar Livro' : t('add_book')}</h1>
      </header>

      {feedback.message && (
        <div className={`feedback-banner ${feedback.type}`}>
          <span className="material-symbols-rounded">
            {feedback.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {feedback.message}
        </div>
      )}

      {isScannerOpen && (
        <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />
      )}

      <form onSubmit={handleSubmit}>
        {}
        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">image</span> Capa do Livro
          </h2>
          <div className="cover-upload-area">
            <div className="cover-preview-container">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview da Capa" className="cover-preview" />
              ) : (
                <span className="material-symbols-rounded dropzone-icon">cloud_upload</span>
              )}
              <span className="dropzone-text" style={{ color: 'var(--text-secondary)' }}>
                {previewUrl ? 'Deseja trocar a capa atual?' : 'Selecione uma opção abaixo'}
              </span>
            </div>

            <div className="cover-actions">
              <label className="btn-action btn-cover-option mobile-camera-btn">
                <span className="material-symbols-rounded">photo_camera</span>
                Tirar Foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="file-input-hidden"
                />
              </label>

              <label className="btn-action btn-cover-option">
                <span className="material-symbols-rounded">photo_library</span>
                Galeria / Arquivo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input-hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {}
        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">auto_stories</span> Importação e Dados
            Principais
          </h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">
                <span className="material-symbols-rounded">magic_button</span> Importação
                Inteligente
              </label>

              {!isOnline && (
                <div
                  style={{
                    padding: '10px',
                    backgroundColor: 'rgba(255, 153, 0, 0.1)',
                    color: '#ff9900',
                    border: '1px solid #ff9900',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    fontSize: '0.9em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '1.2em' }}>
                    wifi_off
                  </span>
                  <span>
                    <strong>Modo Offline:</strong> A importação automática está desativada. Preencha
                    os dados manualmente.
                  </span>
                </div>
              )}

              <div className="isbn-wrapper" style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (isOnline) handleIsbnSearch();
                    }
                  }}
                  className="form-input"
                  placeholder={
                    !isOnline ? 'Desativado sem internet' : 'Pesquisar por código ISBN...'
                  }
                  disabled={!isOnline}
                />

                <button
                  type="button"
                  className="btn-action btn-camera-trigger"
                  onClick={() => setIsScannerOpen(true)}
                  title="Escanear Código de Barras"
                  disabled={!isOnline}
                >
                  <span className="material-symbols-rounded">photo_camera</span>
                </button>

                <button
                  type="button"
                  className="btn-action btn-primary btn-search-trigger"
                  onClick={() => handleIsbnSearch()}
                  disabled={isLoadingIsbn || !formData.isbn || !isOnline}
                >
                  {isLoadingIsbn ? (
                    <span
                      className="material-symbols-rounded spinner-icon"
                      style={{ animation: 'authSpin 1s linear infinite reverse' }}
                    >
                      sync
                    </span>
                  ) : (
                    <span className="material-symbols-rounded">search</span>
                  )}
                  Buscar ISBN
                </button>
              </div>

              <div className="isbn-wrapper">
                <input
                  type="url"
                  value={amazonUrl}
                  onChange={(e) => setAmazonUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (isOnline) handleAmazonImport();
                    }
                  }}
                  className="form-input"
                  placeholder={
                    !isOnline
                      ? 'Desativado sem internet'
                      : 'Ou cole a URL da Amazon (Ex: https://amazon.com.br/dp/...)'
                  }
                  style={{ borderLeft: '4px solid #ff9900' }}
                  disabled={!isOnline}
                />

                <button
                  type="button"
                  className="btn-action btn-search-trigger"
                  onClick={handleAmazonImport}
                  disabled={isLoadingAmazon || !amazonUrl || !isOnline}
                  style={{
                    backgroundColor: isOnline ? '#ff9900' : 'var(--bg-input)',
                    color: isOnline ? '#000' : 'var(--text-muted)',
                    border: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  {isLoadingAmazon ? (
                    <span
                      className="material-symbols-rounded spinner-icon"
                      style={{ animation: 'authSpin 1s linear infinite reverse' }}
                    >
                      sync
                    </span>
                  ) : (
                    <span className="material-symbols-rounded">shopping_cart</span>
                  )}
                  Importar
                </button>
              </div>
            </div>

            <div className="form-group full-width" style={{ marginTop: '10px' }}>
              <label className="form-label">
                <span className="material-symbols-rounded">title</span> Título do Livro *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded">person</span> Autores *
              </label>
              <CreatableSelect
                isMulti
                options={availableAuthors}
                value={formData.authors}
                onChange={(newValue) => setFormData({ ...formData, authors: newValue || [] })}
                styles={customSelectStyles}
                placeholder="Selecione ou digite um novo..."
                formatCreateLabel={(inputValue) => `Cadastrar novo: "${inputValue}"`}
                noOptionsMessage={() => 'Nenhum autor encontrado'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded">translate</span> Tradutores
              </label>
              <CreatableSelect
                isMulti
                options={availableTranslators}
                value={formData.translators}
                onChange={(newValue) => setFormData({ ...formData, translators: newValue || [] })}
                styles={customSelectStyles}
                placeholder="Selecione ou digite um novo..."
                formatCreateLabel={(inputValue) => `Cadastrar novo: "${inputValue}"`}
                noOptionsMessage={() => 'Nenhum tradutor encontrado'}
              />
            </div>
          </div>
        </div>

        {}
        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">category</span> Classificação
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded">sell</span> Gênero Principal
              </label>
              <CreatableSelect
                isClearable
                options={availableGenres}
                value={formData.selectedGenre}
                onChange={(newValue) =>
                  setFormData({ ...formData, selectedGenre: newValue, selectedSubgenre: null })
                }
                styles={customSelectStyles}
                placeholder="Selecione ou digite um novo..."
                formatCreateLabel={(inputValue) => `Criar gênero: "${inputValue}"`}
                noOptionsMessage={() => 'Nenhum gênero encontrado'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded">list</span> Subgênero
              </label>
              <CreatableSelect
                isClearable
                isDisabled={!formData.selectedGenre}
                options={availableSubgenres}
                value={formData.selectedSubgenre}
                onChange={(newValue) => setFormData({ ...formData, selectedSubgenre: newValue })}
                styles={customSelectStyles}
                placeholder={
                  formData.selectedGenre
                    ? 'Selecione ou digite...'
                    : 'Bloqueado (Selecione um Gênero)'
                }
                formatCreateLabel={(inputValue) => `Criar subgênero: "${inputValue}"`}
                noOptionsMessage={() =>
                  formData.selectedGenre
                    ? 'Nenhum subgênero cadastrado neste gênero'
                    : 'Selecione um Gênero Principal primeiro'
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded">style</span> Etiquetas (Tags)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="form-input"
                placeholder="Separadas por vírgula"
              />
            </div>

            {/* Novo Menu de Seleção de Leitura */}
            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded">menu_book</span> Status de Leitura
              </label>
              <select
                name="readingStatus"
                value={formData.readingStatus}
                onChange={handleChange}
                className="form-select"
              >
                <option value="unread">Não Lido</option>
                <option value="reading">Lendo</option>
                <option value="read">Lido</option>
              </select>
            </div>
          </div>
        </div>

        {}
        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">domain</span> Detalhes Editoriais
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded">location_on</span> Local de Publicação
              </label>
              <input
                type="text"
                name="publicationLocation"
                value={formData.publicationLocation}
                onChange={handleChange}
                className="form-input"
                placeholder="Ex: São Paulo, SP"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded">business</span> Editora
              </label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded">calendar_month</span> Ano
              </label>
              <input
                type="number"
                name="releaseYear"
                value={formData.releaseYear}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded">format_list_numbered</span> Edição
              </label>
              <input
                type="text"
                name="edition"
                value={formData.edition}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded">shopping_cart</span> Aquisição
              </label>
              <input
                type="date"
                name="acquisitionDate"
                value={formData.acquisitionDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">edit_note</span> Notas Pessoais
          </h2>
          <div className="form-group full-width">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Suas considerações sobre o livro..."
            ></textarea>
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
            {isSaving ? (
              <span
                className="material-symbols-rounded spinner-icon"
                style={{ animation: 'authSpin 1s linear infinite reverse' }}
              >
                sync
              </span>
            ) : (
              <span className="material-symbols-rounded">save</span>
            )}
            {isSaving ? 'A guardar...' : isEditMode ? 'Atualizar Livro' : 'Guardar Livro'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;
