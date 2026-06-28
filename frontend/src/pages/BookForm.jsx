import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import CreatableSelect from 'react-select/creatable'; 
import BarcodeScanner from '../components/BarcodeScanner'; 
import './BookForm.css'; 

const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%232c2c2c" stroke="%23D4AF37" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  if (filename.startsWith('http')) return filename; 
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
  const fileBaseUrl = apiUrl.replace('/api', '/files');
  return `${fileBaseUrl}/${filename}`;
};

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
    backgroundColor: '#333333',
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
  })
};

const BookForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    isbn: '', title: '', edition: '', releaseYear: '', publisher: '', publicationLocation: '', acquisitionDate: '',
    notes: '', coverImage: '', authors: [], translators: [], tags: '',
    selectedGenre: '', selectedSubgenres: []
  });

  const [attributes, setAttributes] = useState({ genres: [] });
  const [availableSubgenres, setAvailableSubgenres] = useState([]);
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [availableTranslators, setAvailableTranslators] = useState([]);

  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [isLoadingIsbn, setIsLoadingIsbn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' }); 
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const attrRes = await api.get('/attributes').catch(() => ({ 
          data: { genres: [], authors: [], translators: [] } 
        }));
        
        const data = attrRes.data;
        setAttributes(data);
        
        const authorsList = Array.isArray(data.authors) ? data.authors.map(a => ({ value: a.name, label: a.name })) : [];
        const translatorsList = Array.isArray(data.translators) ? data.translators.map(t => ({ value: t.name, label: t.name })) : [];
        
        setAvailableAuthors(authorsList);
        setAvailableTranslators(translatorsList);

        if (isEditMode) {
          const bookRes = await api.get(`/books/${id}`);
          const b = bookRes.data;
          
          const bookAuthors = b.Authors || b.authors || [];
          const bookTranslators = b.Translators || b.translators || [];
          const bookTags = b.Tags || b.tags || [];
          const bookGenres = b.Genres || b.genres || [];
          const bookSubgenres = b.Subgenres || b.subgenres || [];

          setFormData({
            isbn: b.isbn || '', 
            title: b.title || '',
            edition: b.edition || '',
            releaseYear: b.releaseYear || '',
            publicationLocation: b.publicationLocation || '',
            publisher: b.publisher || '',
            acquisitionDate: b.acquisitionDate ? b.acquisitionDate.split('T')[0] : '',
            notes: b.notes || '',
            coverImage: b.coverImage || '',
            authors: bookAuthors.map(a => ({ value: a.name, label: a.name })),
            translators: bookTranslators.map(t => ({ value: t.name, label: t.name })),
            tags: bookTags.map(t => t.name).join(', '),
            selectedGenre: bookGenres.length > 0 ? bookGenres[0].name : '',
            selectedSubgenres: bookSubgenres.map(s => s.id.toString())
          });

          if (b.coverImage) setPreviewUrl(getCoverUrl(b.coverImage));
        }
      } catch (error) {
        setFeedback({ type: 'error', message: 'Erro ao carregar os dados. Verifique a sua conexão.' });
      }
    };
    fetchInitialData();
  }, [id, isEditMode]);

  useEffect(() => {
    if (formData.selectedGenre && attributes.genres) {
      const genreObj = attributes.genres.find(g => g.name === formData.selectedGenre);
      setAvailableSubgenres(genreObj ? genreObj.Subgenres : []);
    } else {
      setAvailableSubgenres([]);
    }
  }, [formData.selectedGenre, attributes.genres]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleSubgenreChange = (e) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, selectedSubgenres: values });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      const MAX_FILE_SIZE = 2097152; 
      
      if (file.size > MAX_FILE_SIZE) {
        setFeedback({ type: 'error', message: 'A imagem é muito pesada. O tamanho máximo permitido para a capa é de 2MB.' });
        e.target.value = null; 
        return; 
      }
      
      setFeedback({ type: '', message: '' });
      setCoverFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, coverImage: '' })); 
    } else {
      setCoverFile(null);
      setPreviewUrl(null);
    }
  };

  const handleScanSuccess = (decodedIsbn) => {
    setIsScannerOpen(false);
    setFormData(prev => ({ ...prev, isbn: decodedIsbn }));
    setTimeout(() => {
      handleIsbnSearch(decodedIsbn);
    }, 100);
  };

  const handleIsbnSearch = async (directIsbn = null) => {
    const targetIsbn = directIsbn || formData.isbn;
    if (!targetIsbn) return;
    
    setIsLoadingIsbn(true);
    setFeedback({ type: '', message: '' }); 
    
    const cleanIsbn = targetIsbn.replace(/\D/g, '');
    let fetchedData = null;

    try {
      try {
        const response = await fetch(`https://brasilapi.com.br/api/isbn/v1/${cleanIsbn}`);
        if (response.ok) {
          const data = await response.json();
          fetchedData = {
            title: data.title || '',
            publisher: data.publisher || '',
            releaseYear: data.year ? String(data.year) : '',
            location: data.location || '',
            coverUrl: data.cover_url || '',
            authors: data.authors || [] 
          };
        }
      } catch (error) {
        console.warn("Brasil API falhou, tentando Google Books...");
      }

      if (!fetchedData) {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const info = data.items[0].volumeInfo;
          
          let cUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
          if (cUrl) cUrl = cUrl.replace(/^http:/i, 'https:');

          fetchedData = {
            title: info.title || '',
            publisher: info.publisher || '',
            releaseYear: info.publishedDate ? info.publishedDate.substring(0, 4) : '',
            location: '',
            coverUrl: cUrl,
            authors: info.authors || [] 
          };
        }
      }

      if (fetchedData) {
        const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        const processedAuthors = fetchedData.authors.map(authorName => {
          let finalName = authorName.trim();
          
          if (finalName.includes(',')) {
            const parts = finalName.split(',');
            if (parts.length === 2) {
              const lastName = parts[0].trim();
              const firstName = parts[1].trim();
              
              const formattedLastName = lastName === lastName.toUpperCase() 
                ? lastName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                : lastName;
                
              finalName = `${firstName} ${formattedLastName}`;
            }
          }

          const sanitizedNewName = removeAccents(finalName);
          const existingAuthor = availableAuthors.find(existing => 
            removeAccents(existing.value) === sanitizedNewName
          );

          return existingAuthor ? existingAuthor : { value: finalName, label: finalName }; 
        });

        setFormData(prev => ({
          ...prev,
          isbn: cleanIsbn,
          title: fetchedData.title || prev.title,
          publisher: fetchedData.publisher || prev.publisher,
          releaseYear: fetchedData.releaseYear || prev.releaseYear,
          publicationLocation: fetchedData.location || prev.publicationLocation,
          authors: processedAuthors.length > 0 ? processedAuthors : prev.authors,
          coverImage: (!coverFile && fetchedData.coverUrl) ? fetchedData.coverUrl : prev.coverImage
        }));

        if (fetchedData.coverUrl && !coverFile) {
          try {
            const imgRes = await fetch(fetchedData.coverUrl);
            if (imgRes.ok) {
              const blob = await imgRes.blob();
              const file = new File([blob], 'cover_fetched.jpg', { type: blob.type });
              setCoverFile(file);
              setPreviewUrl(URL.createObjectURL(file));
              setFormData(prev => ({ ...prev, coverImage: '' }));
            } else {
              setPreviewUrl(fetchedData.coverUrl);
            }
          } catch (err) {
            setPreviewUrl(fetchedData.coverUrl);
          }
        }

        setFeedback({ type: 'info', message: 'Dados do livro preenchidos com sucesso!' });
      } else {
        setFeedback({ type: 'error', message: 'Livro não encontrado nas bases de dados. Preencha manualmente.' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Erro ao buscar as informações. Verifique sua conexão.' });
    } finally {
      setIsLoadingIsbn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: '', message: '' });

    const payloadForm = new FormData();
    
    payloadForm.append('isbn', formData.isbn);
    payloadForm.append('title', formData.title);
    payloadForm.append('edition', formData.edition);
    payloadForm.append('releaseYear', formData.releaseYear);
    payloadForm.append('publicationLocation', formData.publicationLocation);
    payloadForm.append('publisher', formData.publisher);
    payloadForm.append('acquisitionDate', formData.acquisitionDate);
    payloadForm.append('notes', formData.notes);

    const authorsArr = formData.authors ? formData.authors.map(a => a.value) : [];
    payloadForm.append('authors', JSON.stringify(authorsArr));

    const transArr = formData.translators ? formData.translators.map(t => t.value) : [];
    payloadForm.append('translators', JSON.stringify(transArr));

    const tagsArr = formData.tags ? formData.tags.split(',').map(i => i.trim()).filter(i => i !== '') : [];
    payloadForm.append('tags', JSON.stringify(tagsArr));

    const genresArr = formData.selectedGenre ? [formData.selectedGenre] : [];
    payloadForm.append('genres', JSON.stringify(genresArr));
    payloadForm.append('subgenres', JSON.stringify(formData.selectedSubgenres));

    if (coverFile) {
      payloadForm.append('coverImage', coverFile);
    } else if (formData.coverImage) {
      payloadForm.append('coverImage', formData.coverImage);
    }

    try {
      if (isEditMode) {
        await api.put(`/books/${id}`, payloadForm);
        navigate(`/livro/${id}`);
      } else {
        await api.post('/books', payloadForm);
        navigate('/biblioteca');
      }
    } catch (error) {
      setFeedback({ type: 'error', message: `Erro ao salvar: ${error.response?.data?.error || error.message}` });
      setIsSaving(false); 
    }
  };

  return (
    <div className="form-container">
      <header className="form-header">
        <span className="material-symbols-rounded" style={{ fontSize: '2.5em', color: 'var(--accent-gold)' }}>
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
        <BarcodeScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      <form onSubmit={handleSubmit}>
        
        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">image</span> Capa do Livro
          </h2>
          <label className="cover-dropzone">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview da Capa" className="cover-preview" />
            ) : (
              <span className="material-symbols-rounded dropzone-icon">cloud_upload</span>
            )}
            <span className="dropzone-text" style={{ color: 'var(--text-secondary)' }}>
              {previewUrl ? 'Clique para trocar a imagem' : 'Clique ou arraste a capa aqui (Máx: 2MB)'}
            </span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="file-input-hidden" />
          </label>
        </div>

        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">auto_stories</span> Informações Principais
          </h2>
          <div className="form-grid">
            
            <div className="form-group full-width">
              <label className="form-label">
                <span className="material-symbols-rounded">barcode_scanner</span> ISBN (Código de Barras)
              </label>
              
              <div className="isbn-responsive-wrapper">
                <input 
                  type="text" 
                  name="isbn" 
                  value={formData.isbn} 
                  onChange={handleChange} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault(); 
                      handleIsbnSearch(); 
                    }
                  }}
                  className="form-input" 
                  placeholder="Ex: 9788535914849" 
                />
                
                <button 
                  type="button" 
                  className="btn-action btn-camera-trigger" 
                  onClick={() => setIsScannerOpen(true)}
                  title="Escanear Código de Barras"
                >
                  <span className="material-symbols-rounded">photo_camera</span>
                </button>

                <button 
                  type="button" 
                  className="btn-action btn-primary btn-search-trigger" 
                  onClick={() => handleIsbnSearch()}
                  disabled={isLoadingIsbn || !formData.isbn}
                >
                  {isLoadingIsbn ? (
                    <span className="material-symbols-rounded spinner-icon" style={{ animation: 'authSpin 1s linear infinite reverse' }}>sync</span>
                  ) : (
                    <span className="material-symbols-rounded">search</span>
                  )}
                  Buscar
                </button>
              </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label"><span className="material-symbols-rounded">title</span> Título do Livro *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className="form-input" />
            </div>
            
            <div className="form-group">
              <label className="form-label"><span className="material-symbols-rounded">person</span> Autores *</label>
              <CreatableSelect
                isMulti
                options={availableAuthors}
                value={formData.authors}
                onChange={(newValue) => setFormData({ ...formData, authors: newValue || [] })}
                styles={customSelectStyles}
                placeholder="Selecione ou digite um novo..."
                formatCreateLabel={(inputValue) => `Cadastrar novo: "${inputValue}"`}
                noOptionsMessage={() => "Nenhum autor encontrado"}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label"><span className="material-symbols-rounded">translate</span> Tradutores</label>
              <CreatableSelect
                isMulti
                options={availableTranslators}
                value={formData.translators}
                onChange={(newValue) => setFormData({ ...formData, translators: newValue || [] })}
                styles={customSelectStyles}
                placeholder="Selecione ou digite um novo..."
                formatCreateLabel={(inputValue) => `Cadastrar novo: "${inputValue}"`}
                noOptionsMessage={() => "Nenhum tradutor encontrado"}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">category</span> Classificação
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label"><span className="material-symbols-rounded">sell</span> Gênero Principal</label>
              <select name="selectedGenre" value={formData.selectedGenre} onChange={handleChange} className="form-select">
                <option value="">Selecione um Gênero...</option>
                {attributes.genres && attributes.genres.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><span className="material-symbols-rounded">style</span> Tags</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="form-input" placeholder="Separadas por vírgula" />
            </div>
            <div className="form-group full-width">
              <label className="form-label"><span className="material-symbols-rounded">list</span> Subgêneros (Segure CTRL)</label>
              <select multiple value={formData.selectedSubgenres} onChange={handleSubgenreChange} className="form-select" style={{ height: '100px' }}>
                {availableSubgenres.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">domain</span> Detalhes Editoriais
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label"><span className="material-symbols-rounded">location_on</span> Local de Publicação</label>
              <input type="text" name="publicationLocation" value={formData.publicationLocation} onChange={handleChange} className="form-input" placeholder="Ex: São Paulo, SP" />
            </div>
            <div className="form-group">
              <label className="form-label"><span className="material-symbols-rounded">business</span> Editora</label>
              <input type="text" name="publisher" value={formData.publisher} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label"><span className="material-symbols-rounded">calendar_month</span> Ano</label>
              <input type="number" name="releaseYear" value={formData.releaseYear} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label"><span className="material-symbols-rounded">format_list_numbered</span> Edição</label>
              <input type="text" name="edition" value={formData.edition} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label"><span className="material-symbols-rounded">shopping_cart</span> Aquisição</label>
              <input type="date" name="acquisitionDate" value={formData.acquisitionDate} onChange={handleChange} className="form-input" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">edit_note</span> Notas Pessoais
          </h2>
          <div className="form-group full-width">
            <textarea name="notes" value={formData.notes} onChange={handleChange} className="form-textarea" placeholder="Suas considerações sobre o livro..."></textarea>
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
          <button 
            type="submit" 
            className="btn-action btn-primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="material-symbols-rounded spinner-icon" style={{ animation: 'authSpin 1s linear infinite reverse' }}>sync</span>
            ) : (
              <span className="material-symbols-rounded">save</span>
            )}
            {isSaving ? 'Salvando...' : (isEditMode ? 'Atualizar Livro' : 'Salvar Livro')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;