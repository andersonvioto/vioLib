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
 * Retorna um objeto com a versão Plain Text (para bloco de notas) e a versão HTML (para o Word/Docs com negrito e itálico).
 * * @param {Object} book - O objeto do livro contendo autores, título, etc.
 * @param {'ABNT' | 'APA' | 'Vancouver' | 'Harvard' | 'MLA' | 'Chicago'} format - O formato desejado.
 * @returns {{ plain: string, html: string }}
 */
export const getCitationText = (book, format) => {
  
  // Tratamento específico ABNT (SOBRENOME, Nome)
  const formatAuthorABNT = (fullName) => {
    if (!fullName) return 'AUTOR DESCONHECIDO';
    const parts = fullName.trim().split(' ');
    if (parts.length <= 1) return fullName.toUpperCase();
    
    const lastName = parts[parts.length - 1];
    const firstNames = parts.slice(0, -1).join(' ');
    return `${lastName.toUpperCase()}, ${firstNames}`;
  };

  // Tratamento Específico APA, Harvard, Chicago (Sobrenome, N. do Meio.)
  const formatAuthorAPA = (fullName) => {
    if (!fullName) return 'Autor Desconhecido';
    const parts = fullName.trim().split(' ');
    if (parts.length <= 1) return fullName;
    
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(name => `${name.charAt(0)}.`);
    return `${lastName}, ${initials.join(' ')}`;
  };

  // Tratamento Específico MLA e Vancouver (Sobrenome, Nome Inteiro ou Iniciais coladas)
  const formatAuthorMLA = (fullName) => {
    if (!fullName) return 'Autor Desconhecido';
    const parts = fullName.trim().split(' ');
    if (parts.length <= 1) return fullName;
    const lastName = parts.pop();
    return `${lastName}, ${parts.join(' ')}`;
  };

  const authorFull = book.Authors?.length > 0 ? book.Authors[0].name : '';
  const title = book.title || 'Título Desconhecido';
  const year = book.releaseYear || '[s.d.]';
  const city = book.publicationLocation || '[S.l.]';
  const pub = book.publisher || '[s.n.]';
  const ed = book.edition ? `${book.edition}. ed. ` : ''; // Ajuste ABNT de edição

  switch(format) {
    case 'ABNT': 
      return {
        plain: `${formatAuthorABNT(authorFull)}. ${title}. ${ed}${city}: ${pub}, ${year}.`,
        html: `${formatAuthorABNT(authorFull)}. <b>${title}</b>. ${ed}${city}: ${pub}, ${year}.`
      };
    
    case 'APA': 
      return {
        plain: `${formatAuthorAPA(authorFull)}. (${year}). ${title}. ${pub}.`,
        html: `${formatAuthorAPA(authorFull)}. (${year}). <i>${title}</i>. ${pub}.`
      };
    
    case 'Vancouver': 
      // Vancouver costuma grudar as iniciais: SOBRENOME AS
      const vancouverAuthor = authorFull ? formatAuthorAPA(authorFull).replace(/\./g, '').replace(/,/g, '') : 'Autor Desconhecido';
      return {
        plain: `${vancouverAuthor}. ${title}. ${ed}${city}: ${pub}; ${year}.`,
        html: `${vancouverAuthor}. ${title}. ${ed}${city}: ${pub}; ${year}.` // Vancouver não usa marcações fortes
      };
    
    case 'Harvard': 
      return {
        plain: `${formatAuthorAPA(authorFull)}, ${year}. ${title}. ${ed}${city}: ${pub}.`,
        html: `${formatAuthorAPA(authorFull)}, ${year}. <i>${title}</i>. ${ed}${city}: ${pub}.`
      };

    case 'MLA': 
      return {
        plain: `${formatAuthorMLA(authorFull)}. ${title}. ${ed}${pub}, ${year}.`,
        html: `${formatAuthorMLA(authorFull)}. <i>${title}</i>. ${ed}${pub}, ${year}.`
      };
    
    case 'Chicago': 
      return {
        plain: `${formatAuthorMLA(authorFull)}. ${title}. ${city}: ${pub}, ${year}.`,
        html: `${formatAuthorMLA(authorFull)}. <i>${title}</i>. ${city}: ${pub}, ${year}.`
      };

    default: 
      return { plain: '', html: '' };
  }
};