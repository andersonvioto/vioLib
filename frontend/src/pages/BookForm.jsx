import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const BookForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams(); // Se tiver ID na URL, estamos no modo Edição
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    title: '', edition: '', releaseYear: '', publisher: '', acquisitionDate: '',
    notes: '', coverImage: '', authors: '', translators: '', tags: '',
    selectedGenre: '', selectedSubgenres: []
  });

  const [attributes, setAttributes] = useState({ genres: [] });
  const [availableSubgenres, setAvailableSubgenres] = useState([]);
  const [coverFile, setCoverFile] = useState(null);

  // Busca os atributos (gêneros, etc.) e os dados do livro caso seja Edição
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const attrRes = await api.get('/attributes');
        setAttributes(attrRes.data);

        // Se estiver editando, busca o livro e preenche o formulário
        if (isEditMode) {
          const bookRes = await api.get(`/books/${id}`);
          const b = bookRes.data;
          
          setFormData({
            title: b.title || '',
            edition: b.edition || '',
            releaseYear: b.releaseYear || '',
            publisher: b.publisher || '',
            acquisitionDate: b.acquisitionDate ? b.acquisitionDate.split('T')[0] : '', // Formata a data pro input
            notes: b.notes || '',
            coverImage: b.coverImage || '',
            authors: b.Authors ? b.Authors.map(a => a.name).join(', ') : '',
            translators: b.Translators ? b.Translators.map(t => t.name).join(', ') : '',
            tags: b.Tags ? b.Tags.map(t => t.name).join(', ') : '',
            selectedGenre: b.Genres && b.Genres.length > 0 ? b.Genres[0].name : '',
            selectedSubgenres: b.Subgenres ? b.Subgenres.map(s => s.id.toString()) : []
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    fetchInitialData();
  }, [id, isEditMode]);

  // Atualiza Subgêneros disponíveis quando o Gênero muda
  useEffect(() => {
    if (formData.selectedGenre) {
      const genreObj = attributes.genres.find(g => g.name === formData.selectedGenre);
      setAvailableSubgenres(genreObj ? genreObj.Subgenres : []);
    } else {
      setAvailableSubgenres([]);
    }
  }, [formData.selectedGenre, attributes.genres]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubgenreChange = (e) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, selectedSubgenres: values });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // FormData é o formato correto para enviar arquivos + texto
    const payloadForm = new FormData();
    payloadForm.append('title', formData.title);
    payloadForm.append('edition', formData.edition);
    payloadForm.append('releaseYear', formData.releaseYear);
    payloadForm.append('publisher', formData.publisher);
    payloadForm.append('acquisitionDate', formData.acquisitionDate);
    payloadForm.append('notes', formData.notes);

    // Arrays são transformados em JSON para viajar de forma segura
    const authorsArr = formData.authors ? formData.authors.split(',').map(i => i.trim()) : [];
    payloadForm.append('authors', JSON.stringify(authorsArr));

    const transArr = formData.translators ? formData.translators.split(',').map(i => i.trim()) : [];
    payloadForm.append('translators', JSON.stringify(transArr));

    const tagsArr = formData.tags ? formData.tags.split(',').map(i => i.trim()) : [];
    payloadForm.append('tags', JSON.stringify(tagsArr));

    const genresArr = formData.selectedGenre ? [formData.selectedGenre] : [];
    payloadForm.append('genres', JSON.stringify(genresArr));

    payloadForm.append('subgenres', JSON.stringify(formData.selectedSubgenres));

    // Anexa o arquivo de imagem, se houver
    if (coverFile) {
      payloadForm.append('coverImage', coverFile);
    }

    try {
      if (isEditMode) {
        await api.put(`/books/${id}`, payloadForm); // Axios percebe que é FormData automaticamente
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
    <div style={styles.container}>
      <h2 style={{ marginBottom: '20px' }}>{isEditMode ? 'Editar Livro' : t('add_book')}</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <input name="title" value={formData.title} placeholder="Título do Livro *" required onChange={handleChange} style={styles.input} />
        
        <div style={styles.row}>
          <input name="authors" value={formData.authors} placeholder="Autores (separados por vírgula) *" required onChange={handleChange} style={styles.input} />
          <input name="translators" value={formData.translators} placeholder="Tradutores (separados por vírgula)" onChange={handleChange} style={styles.input} />
        </div>

        <div style={styles.row}>
          <select name="selectedGenre" value={formData.selectedGenre} onChange={handleChange} style={styles.select}>
            <option value="">Selecione um Gênero...</option>
            {attributes.genres.map(g => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>

          <select multiple value={formData.selectedSubgenres} onChange={handleSubgenreChange} style={styles.selectMultiple} title="Segure CTRL para selecionar mais de um">
            {availableSubgenres.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.row}>
          <input name="edition" value={formData.edition} placeholder="Edição" onChange={handleChange} style={styles.input} />
          <input name="releaseYear" value={formData.releaseYear} type="number" placeholder="Ano Lançamento" onChange={handleChange} style={styles.input} />
          <input name="publisher" value={formData.publisher} placeholder="Editora" onChange={handleChange} style={styles.input} />
        </div>

        <div style={styles.row}>
          <input name="acquisitionDate" value={formData.acquisitionDate} type="date" placeholder="Data de Aquisição" onChange={handleChange} style={styles.input} />
          <input name="tags" value={formData.tags} placeholder="Tags (separadas por vírgula)" onChange={handleChange} style={styles.input} />
        </div>

        <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Capa do Livro</label>
            <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setCoverFile(e.target.files[0])} 
            style={styles.input} 
            />
        </div>
        
        <textarea name="notes" value={formData.notes} placeholder="Notas pessoais" onChange={handleChange} style={{...styles.input, height: '80px'}}></textarea>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button type="button" onClick={() => navigate(-1)} style={styles.btnCancel}>Cancelar</button>
          <button type="submit" className="btn-primary" style={{ flex: 1 }}>
            {isEditMode ? 'Atualizar Livro' : 'Salvar Livro'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ... os estilos (styles) continuam exatamente os mesmos do código anterior
const styles = {
  container: { padding: '40px', maxWidth: '800px', margin: '0 auto' },
  form: { background: 'var(--surface-color)', padding: '30px', borderRadius: '8px' },
  row: { display: 'flex', gap: '15px', marginBottom: '15px' },
  input: { flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#2c2c2c', color: 'white', marginBottom: '15px' },
  select: { flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#2c2c2c', color: 'white', marginBottom: '15px', height: '45px' },
  selectMultiple: { flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#2c2c2c', color: 'white', marginBottom: '15px', height: '80px' },
  btnCancel: { padding: '10px 20px', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-title)', fontWeight: 'bold' }
};

export default BookForm;