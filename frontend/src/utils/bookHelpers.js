export const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%232c2c2c" stroke="%23D4AF37" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

export const getCoverUrl = (filename) => {
  if (!filename) return DEFAULT_COVER;
  if (filename.startsWith('http')) return filename; 
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
  return `${apiUrl.replace('/api', '/files')}/${filename}`;
};

export const formatDateSafe = (dateString) => {
  if (!dateString) return '';
  return dateString.split('-').reverse().join('/');
};

/**
 * Formata a string de citação com base nas normas internacionais.
 * @param {Object} book - O objeto do livro contendo autores, título, etc.
 * @param {'ABNT' | 'APA' | 'Vancouver' | 'Harvard'} format - O formato desejado.
 */
export const getCitationText = (book, format) => {
  const formatAuthorABNT = (fullName) => {
    if (!fullName) return 'AUTOR DESCONHECIDO';
    const parts = fullName.trim().split(' ');
    if (parts.length <= 1) return fullName.toUpperCase();
    
    const lastName = parts[parts.length - 1];
    const firstNames = parts.slice(0, -1).join(' ');
    return `${lastName.toUpperCase()}, ${firstNames}`;
  };

  const authorFull = book.Authors?.length > 0 ? book.Authors[0].name : '';
  const title = book.title;
  const year = book.releaseYear || '[s.d.]';
  const city = book.publicationLocation || '[S.l.]';
  const pub = book.publisher || '[s.n.]';
  const ed = book.edition ? `${book.edition}. ` : '';

  switch(format) {
    case 'ABNT': 
      return `${formatAuthorABNT(authorFull)}. ${title}. ${ed}${city}: ${pub}, ${year}.`;
    case 'APA': 
      return `${formatAuthorABNT(authorFull)} (${year}). ${title}. ${pub}.`;
    case 'Vancouver': 
      return `${authorFull.toUpperCase()}. ${title}. ${ed}${city}: ${pub}; ${year}.`;
    case 'Harvard': 
      return `${authorFull.toUpperCase()}, ${year}. ${title}. ${city}: ${pub}.`;
    default: return '';
  }
};