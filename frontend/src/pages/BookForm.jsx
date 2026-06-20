import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import CreatableSelect from 'react-select/creatable'; // A nova biblioteca mágica
import './book-form.css';

const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%232c2c2c" stroke="%23D4AF37" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
  return `${apiUrl.replace('/api', '/files')}/${filename}`;
};

// --- ESTILOS CUSTOMIZADOS PARA O REACT-SELECT (Tema Dourado/Escuro) ---
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
  
  // O estado agora guarda Arrays VAZIOS para Autores e Tradutores (para o Select entender)
  const [formData, setFormData] = useState({
    title: '', edition: '', releaseYear: '', publisher: '', acquisitionDate: '',
    notes: '', coverImage: '', authors: [], translators: [], tags: '',
    selectedGenre: '', selectedSubgenres: []
  });

  const [attributes, setAttributes] = useState({ genres: [] });
  const [availableSubgenres, setAvailableSubgenres] = useState([]);
  
  // Listas de opções que vêm do banco de dados
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [availableTranslators, setAvailableTranslators] = useState([]);

  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Busca TODOS os dados de uma vez (Gêneros, Autores e Tradutores)
        // OBS: Ajuste a rota '/books/authors' se você a criou em outro lugar no Back-end
        const [attrRes, authRes, transRes] = await Promise.all([
          api.get('/attributes'),
          api.get('/books/authors').catch(() => ({ data: [] })), 
          api.get('/books/translators').catch(() => ({ data: [] }))
        ]);
        
        setAttributes(attrRes.data);
        
        // Transforma os dados em { value, label } que é o padrão que o Select exige
        setAvailableAuthors(authRes.data.map(a => ({ value: a.name, label: a.name })));
        setAvailableTranslators(transRes.data.map(t => ({ value: t.name, label: t.name })));

        if (isEditMode) {
          const bookRes = await api.get(`/books/${id}`);
          const b = bookRes.data;
          
          setFormData({
            title: b.title || '',
            edition: b.edition || '',
            releaseYear: b.releaseYear || '',
            publisher: b.publisher || '',
            acquisitionDate: b.acquisitionDate ? b.acquisitionDate.split('T')[0] : '',
            notes: b.notes || '',
            coverImage: b.coverImage || '',
            // Se já tiver autores salvos, converte eles para o formato do Select
            authors: b.Authors ? b.Authors.map(a => ({ value: a.name, label: a.name })) : [],
            translators: b.Translators ? b.Translators.map(t => ({ value: t.name, label: t.name })) : [],
            tags: b.Tags ? b.Tags.map(t => t.name).join(', ') : '',
            selectedGenre: b.Genres && b.Genres.length > 0 ? b.Genres[0].name : '',
            selectedSubgenres: b.Subgenres ? b.Subgenres.map(s => s.id.toString()) : []
          });

          if (b.coverImage) setPreviewUrl(getCoverUrl(b.coverImage));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
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
    setCoverFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payloadForm = new FormData();
    
    payloadForm.append('title', formData.title);
    payloadForm.append('edition', formData.edition);
    payloadForm.append('releaseYear', formData.releaseYear);
    payloadForm.append('publisher', formData.publisher);
    payloadForm.append('acquisitionDate', formData.acquisitionDate);
    payloadForm.append('notes', formData.notes);

    // Converte os objetos {value, label} do Select de volta para uma lista de strings simples
    const authorsArr = formData.authors ? formData.authors.map(a => a.value) : [];
    payloadForm.append('authors', JSON.stringify(authorsArr));

    const transArr = formData.translators ? formData.translators.map(t => t.value) : [];
    payloadForm.append('translators', JSON.stringify(transArr));

    const tagsArr = formData.tags ? formData.tags.split(',').map(i => i.trim()) : [];
    payloadForm.append('tags', JSON.stringify(tagsArr));

    const genresArr = formData.selectedGenre ? [formData.selectedGenre] : [];
    payloadForm.append('genres', JSON.stringify(genresArr));
    payloadForm.append('subgenres', JSON.stringify(formData.selectedSubgenres));

    if (coverFile) payloadForm.append('coverImage', coverFile);

    try {
      if (isEditMode) {
        await api.put(`/books/${id}`, payloadForm);
        navigate(`/livro/${id}`);
      } else {
        await api.post('/books', payloadForm);
        navigate('/biblioteca');
      }
    } catch (error) {
      alert(`Erro ao salvar: ` + (error.response?.data?.error || error.message));
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

      <form onSubmit={handleSubmit}>
        
        {/* SEÇÃO 1: UPLOAD DE CAPA */}
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
              {previewUrl ? 'Clique para trocar a imagem' : 'Clique ou arraste a capa aqui'}
            </span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="file-input-hidden" />
          </label>
        </div>

        {/* SEÇÃO 2: INFORMAÇÕES PRINCIPAIS */}
        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">auto_stories</span> Informações Principais
          </h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label"><span className="material-symbols-rounded">title</span> Título do Livro *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className="form-input" />
            </div>
            
            {/* NOVO CAMPO: AUTORES (Creatable Multi-Select) */}
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
            
            {/* NOVO CAMPO: TRADUTORES (Creatable Multi-Select) */}
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

        {/* SEÇÃO 3: CLASSIFICAÇÃO */}
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

        {/* SEÇÃO 4: DETALHES EDITORIAIS (Mantido igual) */}
        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">domain</span> Detalhes Editoriais
          </h2>
          <div className="form-grid">
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

        {/* SEÇÃO 5: NOTAS */}
        <div className="form-section">
          <h2 className="section-title">
            <span className="material-symbols-rounded">edit_note</span> Notas Pessoais
          </h2>
          <div className="form-group full-width">
            <textarea name="notes" value={formData.notes} onChange={handleChange} className="form-textarea" placeholder="Suas considerações sobre o livro..."></textarea>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn-action" style={{ border: 'none', color: 'var(--text-secondary)' }}>
            Cancelar
          </button>
          <button type="submit" className="btn-action btn-primary">
            <span className="material-symbols-rounded">save</span>
            {isEditMode ? 'Atualizar Livro' : 'Salvar Livro'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;