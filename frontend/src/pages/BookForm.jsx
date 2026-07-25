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
    boxShadow: state.isFocused ? '0 0 0 3px var(--accent-gold-glow)' : 'none',
    '&:hover': {
      borderColor: state.isFocused
        ? 'var(--accent-gold)'
        : 'var(--border-hover, rgba(255, 255, 255, 0.2))'
    },
    minHeight: '48px',
    padding: '2px 4px',
    borderRadius: 'var(--radius-sm, 6px)',
    cursor: 'text',
    transition: 'all 0.2s ease'
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md, 8px)',
    boxShadow: 'var(--shadow-float, 0 20px 25px -5px rgba(0, 0, 0, 0.5))',
    zIndex: 100,
    overflow: 'hidden'
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? 'var(--accent-gold-subtle, rgba(212, 175, 55, 0.15))'
      : 'transparent',
    color: state.isFocused ? 'var(--accent-gold)' : 'var(--text-primary)',
    cursor: 'pointer',
    padding: '12px 16px',
    fontSize: '0.95rem',
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
    fontSize: '0.85rem',
    fontWeight: '500',
    padding: '4px 8px'
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '0 6px',
    borderRadius: '0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0',
    '&:hover': { backgroundColor: 'var(--text-danger, #f87171)', color: '#ffffff' }
  }),
  input: (provided) => ({
    ...provided,
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    margin: '0 4px'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--text-muted)',
    fontSize: '0.95rem'
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'var(--text-primary)',
    fontSize: '0.95rem'
  })
};

/**
 * Componente do formulário de criação e edição de livros.
 * Orquestra importação inteligente (ISBN/Amazon) e sinaliza visualmente a flexibilidade dos metadados opcionais.
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
        <span className="material-symbols-rounded form-header-icon" aria-hidden="true">
          {isEditMode ? 'edit_document' : 'library_add'}
        </span>
        <div className="form-header-text">
          <h1 className="form-title">
            {isEditMode ? 'Editar Livro' : t('add_book', 'Cadastrar Novo Livro')}
          </h1>
          <p className="form-subtitle">
            Apenas o campo <strong>Título do Livro</strong> é obrigatório. Todos os demais dados são
            opcionais e podem ser completados gradualmente.
          </p>
        </div>
      </header>

      {feedback.message && (
        <div className={`feedback-banner ${feedback.type}`} role="alert">
          <span className="material-symbols-rounded" aria-hidden="true">
            {feedback.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{feedback.message}</span>
        </div>
      )}

      {isScannerOpen && (
        <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />
      )}

      <form onSubmit={handleSubmit} className="book-editorial-form" noValidate>
        <section className="form-section" aria-label="Capa da Obra">
          <h2 className="section-title">
            <div className="section-title-left">
              <span className="material-symbols-rounded" aria-hidden="true">
                image
              </span>
              <span>Capa do Livro</span>
            </div>
            <span className="section-optional-pill">Opcional</span>
          </h2>
          <div className="cover-upload-area">
            <div className="cover-preview-container">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview da Capa" className="cover-preview" />
              ) : (
                <span className="material-symbols-rounded dropzone-icon" aria-hidden="true">
                  cloud_upload
                </span>
              )}
              <span className="dropzone-text">
                {previewUrl
                  ? 'Deseja trocar a capa atual?'
                  : 'Selecione ou fotografe a capa do livro'}
              </span>
            </div>

            <div className="cover-actions">
              <label className="btn-action btn-cover-option mobile-camera-btn">
                <span className="material-symbols-rounded" aria-hidden="true">
                  photo_camera
                </span>
                <span>Tirar Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="file-input-hidden"
                  disabled={isSaving}
                />
              </label>

              <label className="btn-action btn-cover-option">
                <span className="material-symbols-rounded" aria-hidden="true">
                  photo_library
                </span>
                <span>Galeria / Arquivo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input-hidden"
                  disabled={isSaving}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="form-section" aria-label="Importação Inteligente e Dados Principais">
          <h2 className="section-title">
            <div className="section-title-left">
              <span className="material-symbols-rounded" aria-hidden="true">
                auto_stories
              </span>
              <span>Dados Principais e Importação</span>
            </div>
          </h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">
                <span className="material-symbols-rounded" aria-hidden="true">
                  magic_button
                </span>
                <span>Importação Inteligente de Metadados</span>
                <span className="label-helper-text">
                  (Preenche autores, editora e ano automaticamente)
                </span>
              </label>

              {!isOnline && (
                <div className="offline-notice-box" role="status">
                  <span className="material-symbols-rounded" aria-hidden="true">
                    wifi_off
                  </span>
                  <span>
                    <strong>Modo Offline:</strong> As buscas por ISBN e Amazon estão indisponíveis
                    sem internet. Preencha os campos manualmente.
                  </span>
                </div>
              )}

              <div className="isbn-wrapper">
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
                    !isOnline
                      ? 'Busca indisponível offline'
                      : 'Pesquisar por código ISBN (10 ou 13 dígitos)...'
                  }
                  disabled={!isOnline || isSaving}
                />

                <button
                  type="button"
                  className="btn-action btn-camera-trigger"
                  onClick={() => setIsScannerOpen(true)}
                  title="Escanear Código de Barras"
                  aria-label="Escanear Código de Barras com a câmera"
                  disabled={!isOnline || isSaving}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    photo_camera
                  </span>
                </button>

                <button
                  type="button"
                  className="btn-action btn-primary btn-search-trigger"
                  onClick={() => handleIsbnSearch()}
                  disabled={isLoadingIsbn || !formData.isbn || !isOnline || isSaving}
                >
                  {isLoadingIsbn ? (
                    <span className="material-symbols-rounded spinner-icon" aria-hidden="true">
                      sync
                    </span>
                  ) : (
                    <span className="material-symbols-rounded" aria-hidden="true">
                      search
                    </span>
                  )}
                  <span>Buscar ISBN</span>
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
                  className="form-input input-amazon"
                  placeholder={
                    !isOnline
                      ? 'Importação indisponível offline'
                      : 'Ou cole a URL do livro na Amazon (Ex: https://amazon.com.br/dp/...)'
                  }
                  disabled={!isOnline || isSaving}
                />

                <button
                  type="button"
                  className="btn-action btn-amazon-import"
                  onClick={handleAmazonImport}
                  disabled={isLoadingAmazon || !amazonUrl || !isOnline || isSaving}
                >
                  {isLoadingAmazon ? (
                    <span className="material-symbols-rounded spinner-icon" aria-hidden="true">
                      sync
                    </span>
                  ) : (
                    <span className="material-symbols-rounded" aria-hidden="true">
                      shopping_cart
                    </span>
                  )}
                  <span>Importar</span>
                </button>
              </div>
            </div>

            <div className="form-group full-width form-group-spaced">
              <label htmlFor="title" className="form-label">
                <div className="label-main-text">
                  <span className="material-symbols-rounded" aria-hidden="true">
                    title
                  </span>
                  <span>Título do Livro</span>
                </div>
                <span className="label-required-badge">Obrigatório</span>
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-input input-required-highlight"
                placeholder="Título completo da obra"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <div className="label-main-text">
                  <span className="material-symbols-rounded" aria-hidden="true">
                    person
                  </span>
                  <span>Autores</span>
                </div>
                <span className="label-optional-text">(Opcional)</span>
              </label>
              <CreatableSelect
                isMulti
                options={availableAuthors}
                value={formData.authors}
                onChange={(newValue) => setFormData({ ...formData, authors: newValue || [] })}
                styles={customSelectStyles}
                placeholder="Selecione ou digite o nome do autor..."
                formatCreateLabel={(inputValue) => `Cadastrar novo: "${inputValue}"`}
                noOptionsMessage={() => 'Nenhum autor encontrado'}
                isDisabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <div className="label-main-text">
                  <span className="material-symbols-rounded" aria-hidden="true">
                    translate
                  </span>
                  <span>Tradutores</span>
                </div>
                <span className="label-optional-text">(Opcional)</span>
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
                isDisabled={isSaving}
              />
            </div>
          </div>
        </section>

        <section className="form-section" aria-label="Classificação e Leitura">
          <h2 className="section-title">
            <div className="section-title-left">
              <span className="material-symbols-rounded" aria-hidden="true">
                category
              </span>
              <span>Classificação</span>
            </div>
            <span className="section-optional-pill">Opcional</span>
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded" aria-hidden="true">
                  sell
                </span>
                <span>Gênero Principal</span>
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
                isDisabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-rounded" aria-hidden="true">
                  list
                </span>
                <span>Subgênero</span>
              </label>
              <CreatableSelect
                isClearable
                isDisabled={!formData.selectedGenre || isSaving}
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
              <label htmlFor="tags" className="form-label">
                <span className="material-symbols-rounded" aria-hidden="true">
                  style
                </span>
                <span>Etiquetas (Tags)</span>
              </label>
              <input
                id="tags"
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="form-input"
                placeholder="Separadas por vírgula (Ex: favorito, clássico, capa dura)"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="readingStatus" className="form-label">
                <span className="material-symbols-rounded" aria-hidden="true">
                  menu_book
                </span>
                <span>Status de Leitura</span>
              </label>
              <select
                id="readingStatus"
                name="readingStatus"
                value={formData.readingStatus}
                onChange={handleChange}
                className="form-select"
                disabled={isSaving}
              >
                <option value="unread">Não Lido</option>
                <option value="reading">Lendo</option>
                <option value="read">Lido</option>
              </select>
            </div>
          </div>
        </section>

        <section className="form-section" aria-label="Detalhes Editoriais">
          <h2 className="section-title">
            <div className="section-title-left">
              <span className="material-symbols-rounded" aria-hidden="true">
                domain
              </span>
              <span>Detalhes Editoriais</span>
            </div>
            <span className="section-optional-pill">Opcional</span>
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="publicationLocation" className="form-label">
                <span className="material-symbols-rounded" aria-hidden="true">
                  location_on
                </span>
                <span>Local de Publicação</span>
              </label>
              <input
                id="publicationLocation"
                type="text"
                name="publicationLocation"
                value={formData.publicationLocation}
                onChange={handleChange}
                className="form-input"
                placeholder="Ex: São Paulo, SP"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="publisher" className="form-label">
                <span className="material-symbols-rounded" aria-hidden="true">
                  business
                </span>
                <span>Editora</span>
              </label>
              <input
                id="publisher"
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                className="form-input"
                placeholder="Nome da editora"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="releaseYear" className="form-label">
                <span className="material-symbols-rounded" aria-hidden="true">
                  calendar_month
                </span>
                <span>Ano de Publicação</span>
              </label>
              <input
                id="releaseYear"
                type="number"
                name="releaseYear"
                value={formData.releaseYear}
                onChange={handleChange}
                className="form-input"
                placeholder="Ex: 2024"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edition" className="form-label">
                <span className="material-symbols-rounded" aria-hidden="true">
                  format_list_numbered
                </span>
                <span>Edição / Volume</span>
              </label>
              <input
                id="edition"
                type="text"
                name="edition"
                value={formData.edition}
                onChange={handleChange}
                className="form-input"
                placeholder="Ex: 1ª Edição, Edição de Colecionador"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="acquisitionDate" className="form-label">
                <span className="material-symbols-rounded" aria-hidden="true">
                  shopping_cart
                </span>
                <span>Data de Aquisição</span>
              </label>
              <input
                id="acquisitionDate"
                type="date"
                name="acquisitionDate"
                value={formData.acquisitionDate}
                onChange={handleChange}
                className="form-input"
                disabled={isSaving}
              />
            </div>
          </div>
        </section>

        <section className="form-section" aria-label="Notas Pessoais sobre a Obra">
          <h2 className="section-title">
            <div className="section-title-left">
              <span className="material-symbols-rounded" aria-hidden="true">
                edit_note
              </span>
              <span>Notas Pessoais</span>
            </div>
            <span className="section-optional-pill">Opcional</span>
          </h2>
          <div className="form-group full-width">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Registre aqui citações marcantes, resenha pessoal, estado de conservação ou quem indicou o livro..."
              disabled={isSaving}
            ></textarea>
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
              {isSaving ? 'A guardar...' : isEditMode ? 'Atualizar Livro' : 'Guardar Livro'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;
