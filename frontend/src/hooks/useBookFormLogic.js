import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="transparent" stroke="%23D4AF37" stroke-width="1" stroke-dasharray="4,4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  if (filename.startsWith('http')) return filename; 
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
  const fileBaseUrl = apiUrl.replace('/api', '/files');
  return `${fileBaseUrl}/${filename}`;
};

const formatIsbnInput = (value) => {
  let v = value.replace(/\D/g, '');
  if (v.length > 13) v = v.substring(0, 13);
  
  let masked = v;
  if (v.length > 3) masked = v.substring(0, 3) + '-' + v.substring(3);
  if (v.length > 5) masked = masked.substring(0, 6) + '-' + masked.substring(6);
  if (v.length > 8) masked = masked.substring(0, 10) + '-' + masked.substring(10);
  if (v.length > 12) masked = masked.substring(0, 15) + '-' + masked.substring(15);
  
  return masked;
};

const buildFullTitle = (title, subtitle) => {
  if (!title) return '';
  if (!subtitle) return title.trim();
  
  const cleanTitle = title.trim();
  const cleanSubtitle = subtitle.trim();
  
  if (cleanTitle.endsWith(':')) {
    return `${cleanTitle} ${cleanSubtitle}`;
  }
  return `${cleanTitle}: ${cleanSubtitle}`;
};

const useBookFormLogic = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    isbn: '', title: '', edition: '', releaseYear: '', publisher: '', publicationLocation: '', acquisitionDate: '',
    notes: '', coverImage: '', authors: [], translators: [], tags: '',
    selectedGenre: null, selectedSubgenre: null 
  });

  const [attributes, setAttributes] = useState({ genres: [] });
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableSubgenres, setAvailableSubgenres] = useState([]);
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [availableTranslators, setAvailableTranslators] = useState([]);

  // Estados de Imagem e Crop
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageSrcForCrop, setImageSrcForCrop] = useState(null);

  const [isLoadingIsbn, setIsLoadingIsbn] = useState(false);
  const [amazonUrl, setAmazonUrl] = useState('');
  const [isLoadingAmazon, setIsLoadingAmazon] = useState(false);
  
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
        
        const genresList = Array.isArray(data.genres) ? data.genres.map(g => ({ value: g.name, label: g.name })) : [];
        const authorsList = Array.isArray(data.authors) ? data.authors.map(a => ({ value: a.name, label: a.name })) : [];
        const translatorsList = Array.isArray(data.translators) ? data.translators.map(t => ({ value: t.name, label: t.name })) : [];
        
        setAvailableGenres(genresList);
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
            isbn: b.isbn ? formatIsbnInput(b.isbn) : '', 
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
            selectedGenre: bookGenres.length > 0 ? { value: bookGenres[0].name, label: bookGenres[0].name } : null,
            selectedSubgenre: bookSubgenres.length > 0 ? { value: bookSubgenres[0].name, label: bookSubgenres[0].name } : null
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
    if (formData.selectedGenre && formData.selectedGenre.value && attributes.genres) {
      const genreObj = attributes.genres.find(g => g.name === formData.selectedGenre.value);
      const subgenresArray = genreObj?.Subgenres || genreObj?.subgenres || [];
      setAvailableSubgenres(subgenresArray.map(s => ({ value: s.name, label: s.name })));
    } else {
      setAvailableSubgenres([]);
    }
  }, [formData.selectedGenre, attributes.genres]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'isbn') {
      setFormData({ ...formData, [name]: formatIsbnInput(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // =========================================================================
  // NOVA LÓGICA DA CAPA: Aceita fotos gigantes para repassar ao Cropper
  // =========================================================================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // O limite de 2MB NÃO é mais verificado aqui. A imagem vai para o modal!
      setFeedback({ type: '', message: '' });
      
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrcForCrop(reader.result.toString());
      });
      reader.readAsDataURL(file);
    }
    e.target.value = null; // Reseta o input para permitir selecionar a mesma foto novamente
  };

  // Chamado pelo Cropper quando o usuário clica em "Aplicar e Comprimir"
  const handleCropComplete = (file, url) => {
    // A VALIDAÇÃO DE 2MB OCORRE AQUI, APÓS A COMPRESSÃO (Por garantia técnica)
    const MAX_FILE_SIZE = 2097152; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      setFeedback({ 
        type: 'error', 
        message: 'A imagem original é muito complexa e, mesmo após a compressão, excedeu 2MB. Por favor, tente uma foto mais leve.' 
      });
      setImageSrcForCrop(null);
      return;
    }

    setFeedback({ type: '', message: '' });
    setCoverFile(file);
    setPreviewUrl(url);
    setImageSrcForCrop(null); 
    setFormData(prev => ({ ...prev, coverImage: '' })); 
  };

  const handleCropCancel = () => {
    setImageSrcForCrop(null); 
  };

  const handleScanSuccess = (decodedIsbn) => {
    setIsScannerOpen(false);
    setFormData(prev => ({ ...prev, isbn: formatIsbnInput(decodedIsbn) }));
    setTimeout(() => handleIsbnSearch(decodedIsbn), 100);
  };

  const processFetchedAuthors = (fetchedAuthorsArray) => {
    const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    return fetchedAuthorsArray.map(authorName => {
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
      const existingAuthor = availableAuthors.find(existing => removeAccents(existing.value) === sanitizedNewName);
      return existingAuthor ? existingAuthor : { value: finalName, label: finalName }; 
    });
  };

  const handleAmazonImport = async () => {
    if (!amazonUrl) return;
    setIsLoadingAmazon(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await api.post('/amazon-scrape', { url: amazonUrl });
      const fetchedData = response.data;
      const processedAuthors = processFetchedAuthors(fetchedData.authors || []);

      setFormData(prev => ({
        ...prev,
        isbn: fetchedData.isbn ? formatIsbnInput(fetchedData.isbn) : prev.isbn,
        title: buildFullTitle(fetchedData.title, fetchedData.subtitle) || prev.title,
        publisher: fetchedData.publisher || prev.publisher,
        releaseYear: fetchedData.releaseYear || prev.releaseYear,
        edition: fetchedData.edition || prev.edition,
        authors: processedAuthors.length > 0 ? processedAuthors : prev.authors,
        coverImage: (!coverFile && fetchedData.coverImage) ? fetchedData.coverImage : prev.coverImage
      }));

      if (fetchedData.coverImage && !coverFile) {
        try {
          const imgRes = await fetch(fetchedData.coverImage);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            const file = new File([blob], 'cover_amazon.jpg', { type: blob.type });
            setCoverFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setFormData(prev => ({ ...prev, coverImage: '' }));
          } else {
            setPreviewUrl(fetchedData.coverImage);
          }
        } catch (err) { setPreviewUrl(fetchedData.coverImage); }
      }

      setFeedback({ type: 'info', message: 'Dados da Amazon importados com sucesso!' });
      setAmazonUrl(''); 
    } catch (error) {
      setFeedback({ type: 'error', message: error.response?.data?.error || 'Erro ao extrair dados da Amazon.' });
    } finally {
      setIsLoadingAmazon(false);
    }
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
            title: buildFullTitle(data.title, data.subtitle), 
            publisher: data.publisher || '',
            releaseYear: data.year ? String(data.year) : '', 
            location: data.location || '',
            coverUrl: data.cover_url || '', 
            authors: data.authors || [] 
          };
        }
      } catch (e) { console.warn("BrasilAPI falhou."); }

      if (!fetchedData) {
        try {
          const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
          if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
              const info = data.items[0].volumeInfo;
              let cUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
              if (cUrl) cUrl = cUrl.replace(/^http:/i, 'https:');
              fetchedData = {
                title: buildFullTitle(info.title, info.subtitle), 
                publisher: info.publisher || '',
                releaseYear: info.publishedDate ? info.publishedDate.substring(0, 4) : '', 
                location: '',
                coverUrl: cUrl, 
                authors: info.authors || [] 
              };
            }
          }
        } catch (e) { console.warn("Google Books falhou."); }
      }

      if (!fetchedData) {
        try {
          const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
          if (response.ok) {
            const data = await response.json();
            const bookKey = `ISBN:${cleanIsbn}`;
            if (data[bookKey]) {
              const info = data[bookKey];
              fetchedData = {
                title: buildFullTitle(info.title, info.subtitle), 
                publisher: info.publishers ? info.publishers[0].name : '',
                releaseYear: info.publish_date ? (info.publish_date.match(/\d{4}/)?.[0] || '') : '',
                location: info.publish_places ? info.publish_places[0].name : '',
                coverUrl: info.cover ? (info.cover.large || info.cover.medium || '') : '',
                authors: info.authors ? info.authors.map(a => a.name) : []
              };
            }
          }
        } catch (e) { console.warn("Open Library falhou."); }
      }

      if (fetchedData) {
        const processedAuthors = processFetchedAuthors(fetchedData.authors || []);

        setFormData(prev => ({
          ...prev, isbn: formatIsbnInput(cleanIsbn), title: fetchedData.title || prev.title,
          publisher: fetchedData.publisher || prev.publisher, releaseYear: fetchedData.releaseYear || prev.releaseYear,
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
          } catch (err) { setPreviewUrl(fetchedData.coverUrl); }
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
    payloadForm.append('isbn', formData.isbn.replace(/\D/g, ''));
    payloadForm.append('title', formData.title);
    payloadForm.append('edition', formData.edition);
    payloadForm.append('releaseYear', formData.releaseYear);
    payloadForm.append('publicationLocation', formData.publicationLocation);
    payloadForm.append('publisher', formData.publisher);
    payloadForm.append('acquisitionDate', formData.acquisitionDate);
    payloadForm.append('notes', formData.notes);

    payloadForm.append('authors', JSON.stringify(formData.authors ? formData.authors.map(a => a.value) : []));
    payloadForm.append('translators', JSON.stringify(formData.translators ? formData.translators.map(t => t.value) : []));
    payloadForm.append('tags', JSON.stringify(formData.tags ? formData.tags.split(',').map(i => i.trim()).filter(i => i !== '') : []));
    
    payloadForm.append('genres', JSON.stringify(formData.selectedGenre ? [formData.selectedGenre.value] : []));
    payloadForm.append('subgenres', JSON.stringify(formData.selectedSubgenre ? [formData.selectedSubgenre.value] : []));

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

  return {
    navigate, isEditMode, formData, setFormData, availableGenres, availableSubgenres, 
    availableAuthors, availableTranslators, previewUrl, isLoadingIsbn, isSaving, 
    feedback, isScannerOpen, setIsScannerOpen, handleChange, handleFileChange, 
    handleScanSuccess, handleIsbnSearch, handleSubmit,
    amazonUrl, setAmazonUrl, isLoadingAmazon, handleAmazonImport,
    imageSrcForCrop, handleCropComplete, handleCropCancel
  };
};

export default useBookFormLogic;