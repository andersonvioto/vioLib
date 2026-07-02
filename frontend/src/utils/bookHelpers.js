// Capa padrão adaptada com dobra de lombada e bordas de livro
export const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="transparent" stroke="%23D4AF37" stroke-width="1.5" rx="4"/><line x1="16" y1="0" x2="16" y2="300" stroke="%23D4AF37" stroke-width="1" opacity="0.5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="28" fill="%23D4AF37">vioLib</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888888">Sem Capa</text></svg>`;

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
 * Formata de modo padronizado um ISBN de 13 dígitos
 */
export const formatISBN = (isbn) => {
  if (!isbn) return '';
  const v = String(isbn).replace(/\D/g, '');
  if (v.length !== 13) return isbn; 
  return `${v.substring(0,3)}-${v.substring(3,5)}-${v.substring(5,8)}-${v.substring(8,12)}-${v.substring(12,13)}`;
};

// ============================================================================
// FORMATADORES DE NOMES DE AUTORES (Por Norma)
// ============================================================================

const formatAuthorABNT = (fullName) => {
  const parts = fullName.trim().split(' ');
  if (parts.length <= 1) return fullName.toUpperCase();
  const lastName = parts.pop();
  return `${lastName.toUpperCase()}, ${parts.join(' ')}`;
};

const formatAuthorAPA = (fullName) => {
  const parts = fullName.trim().split(' ');
  if (parts.length <= 1) return fullName;
  const lastName = parts.pop();
  const initials = parts.map(name => `${name.charAt(0)}.`);
  return `${lastName}, ${initials.join(' ')}`;
};

const formatAuthorMLA = (fullName, isFirst = true) => {
  const parts = fullName.trim().split(' ');
  if (parts.length <= 1) return fullName;
  // MLA mantém o nome dos co-autores na ordem direta
  if (!isFirst) return fullName; 
  const lastName = parts.pop();
  return `${lastName}, ${parts.join(' ')}`;
};

const formatAuthorVancouver = (fullName) => {
  const parts = fullName.trim().split(' ');
  if (parts.length <= 1) return fullName.replace(/\./g, '').replace(/,/g, '');
  const lastName = parts.pop();
  const initials = parts.map(name => name.charAt(0)).join('');
  return `${lastName} ${initials}`;
};

// ============================================================================
// MOTOR PRINCIPAL DE CITAÇÃO BIBLIOGRÁFICA
// ============================================================================

/**
 * Formata a string de citação com base nas normas internacionais.
 * Retorna um objeto com a versão Plain Text e HTML (negrito/itálico).
 * * @param {Object} book - O objeto do livro contendo autores, título, etc.
 * @param {'ABNT' | 'APA' | 'Vancouver' | 'Harvard' | 'MLA' | 'Chicago'} format - O formato desejado.
 * @returns {{ plain: string, html: string }}
 */
export const getCitationText = (book, format) => {
  const rawAuthors = book.Authors || [];
  const rawTranslators = book.Translators || [];
  
  const title = book.title ? book.title.trim() : '';
  const year = book.releaseYear ? String(book.releaseYear).trim() : '';
  
  // Limpeza de Município/Estado: Se vier "Curitiba, PR", isola apenas "Curitiba".
  const rawLocation = book.publicationLocation ? book.publicationLocation.trim() : '';
  const city = rawLocation.split(',')[0].trim();
  
  const pub = book.publisher ? book.publisher.trim() : '';
  const rawEdition = book.edition ? book.edition.trim() : '';

  // --- TRATAMENTO INTELIGENTE DA EDIÇÃO ---
  // Verifica se a string contém apenas números
  const isPureNumber = /^\d+$/.test(rawEdition);
  let edABNT = '';
  let edAPA = '';
  
  if (rawEdition) {
    if (isPureNumber) {
      edABNT = `${rawEdition}. ed.`;
      edAPA = `${rawEdition}ª ed.`;
    } else {
      // Deixa a edição exatamente como o usuário digitou
      edABNT = rawEdition;
      edAPA = rawEdition;
    }
  }

  // --- TRATAMENTO INTELIGENTE DOS AUTORES ---
  const getAuthorsBlock = (style) => {
    if (rawAuthors.length === 0) return '';
    
    switch(style) {
      case 'ABNT': {
        if (rawAuthors.length <= 3) {
          return rawAuthors.map(a => formatAuthorABNT(a.name)).join('; ');
        } else {
          return `${formatAuthorABNT(rawAuthors[0].name)} et al.`;
        }
      }
      case 'APA': {
        const apaAuths = rawAuthors.map(a => formatAuthorAPA(a.name));
        if (apaAuths.length === 1) return apaAuths[0];
        if (apaAuths.length === 2) return `${apaAuths[0]} & ${apaAuths[1]}`;
        if (apaAuths.length <= 20) {
          const last = apaAuths.pop();
          return `${apaAuths.join(', ')}, & ${last}`;
        }
        const first19 = apaAuths.slice(0, 19).join(', ');
        return `${first19}, ... ${apaAuths[apaAuths.length - 1]}`;
      }
      case 'Vancouver': {
        const vanAuths = rawAuthors.map(a => formatAuthorVancouver(a.name));
        if (vanAuths.length <= 6) return vanAuths.join(', ');
        return `${vanAuths.slice(0, 6).join(', ')}, et al`;
      }
      case 'MLA': 
      case 'Chicago': {
        if (rawAuthors.length === 1) return formatAuthorMLA(rawAuthors[0].name, true);
        if (rawAuthors.length === 2) return `${formatAuthorMLA(rawAuthors[0].name, true)}, e ${formatAuthorMLA(rawAuthors[1].name, false)}`;
        return `${formatAuthorMLA(rawAuthors[0].name, true)}, et al.`;
      }
      default:
        return rawAuthors.map(a => a.name).join(', ');
    }
  };

  // --- TRATAMENTO INTELIGENTE DOS TRADUTORES ---
  const tNames = rawTranslators.map(t => t.name);
  const getTranslatorsBlock = (style) => {
    if (tNames.length === 0) return '';
    switch(style) {
      case 'ABNT': return `Tradução de ${tNames.join(' e ')}`;
      case 'APA': return `(${tNames.join(' & ')}, Trad.)`;
      default: return `Traduzido por ${tNames.join(' e ')}`;
    }
  };

  const authors = getAuthorsBlock(format);
  const translators = getTranslatorsBlock(format);

  // Helper para agrupar as partes ignorando as vazias e evitando "pontos duplicados"
  const joinParts = (parts, separator = '. ') => {
    const validParts = parts.filter(p => p && String(p).trim() !== '');
    if (validParts.length === 0) return '';
    
    return validParts.reduce((acc, part, index) => {
      if (index === 0) return String(part).trim();
      const cleanPart = String(part).trim();
      
      // Se a string acumulada já terminar num ponto, usamos apenas o espaço em vez do ponto e espaço.
      if (separator === '. ' && acc.endsWith('.')) {
        return `${acc} ${cleanPart}`;
      }
      return `${acc}${separator}${cleanPart}`;
    }, '');
  };

  // Helper de segurança para garantir a pontuação final de fechamento, sem conflito de tags
  const ensureEndingDot = (str) => {
    if (!str) return '';
    const trimmed = String(str).trim();
    // Verifica qual é o último caractere visível ignorando tags como </i> ou </b>
    const cleanStr = trimmed.replace(/<\/?[^>]+(>|$)/g, "");
    if (cleanStr.endsWith('.')) {
        return trimmed;
    }
    return `${trimmed}.`;
  };

  // --- TRATAMENTO DO BLOCO DE PUBLICAÇÃO ---
  const getPubBlockABNT = () => {
    let p = [];
    if (city && pub) p.push(`${city}: ${pub}`);
    else if (city) p.push(city);
    else if (pub) p.push(pub);
    if (year) p.push(year);
    return p.join(', ');
  };
  
  const getPubBlockVancouver = () => {
    let block = '';
    if (city && pub) block = `${city}: ${pub}`;
    else if (city) block = city;
    else if (pub) block = pub;
    if (block && year) return `${block}; ${year}`;
    if (year) return year;
    return block;
  };

  let plain = '';
  let html = '';

  // --- CONSTRUÇÃO FINAL DAS CITAÇÕES ---
  switch(format) {
    case 'ABNT': {
      const abntPub = getPubBlockABNT(); 
      const finalStrPlain = joinParts([authors, title, translators, edABNT, abntPub]);
      const finalStrHtml = joinParts([authors, title ? `<b>${title}</b>` : '', translators, edABNT, abntPub]);
      
      plain = ensureEndingDot(finalStrPlain);
      html = ensureEndingDot(finalStrHtml);
      break;
    }
    case 'APA': {
      const apaYear = year ? `(${year})` : '';
      const parenContent = joinParts([translators ? `${tNames.join(' & ')}, Trad.` : '', edAPA ? edAPA.replace(/[()]/g, '') : ''].filter(Boolean), '; ');
      
      let titleFullPlain = title + (parenContent ? ` (${parenContent})` : '');
      let titleFullHtml = title ? `<i>${title}</i>` + (parenContent ? ` (${parenContent})` : '') : (parenContent ? `(${parenContent})` : '');

      const finalStrPlain = joinParts([authors, apaYear, titleFullPlain, pub]);
      const finalStrHtml = joinParts([authors, apaYear, titleFullHtml, pub]);

      plain = ensureEndingDot(finalStrPlain);
      html = ensureEndingDot(finalStrHtml);
      break;
    }
    case 'Vancouver': {
      const vanPub = getPubBlockVancouver();
      const finalStr = joinParts([authors, title, translators, edABNT, vanPub]);
      plain = ensureEndingDot(finalStr);
      html = plain; 
      break;
    }
    case 'Harvard': {
      let harvardAuthYear = authors + (year ? `, ${year}` : '');
      const harvardPub = city && pub ? `${city}: ${pub}` : (city || pub);
      
      const finalStrPlain = joinParts([harvardAuthYear, title, translators, edABNT, harvardPub]);
      const finalStrHtml = joinParts([harvardAuthYear, title ? `<i>${title}</i>` : '', translators, edABNT, harvardPub]);
      
      plain = ensureEndingDot(finalStrPlain);
      html = ensureEndingDot(finalStrHtml);
      break;
    }
    case 'MLA': {
      const mlaPubYear = joinParts([pub, year], ', ');
      
      const finalStrPlain = joinParts([authors, title, translators, edABNT, mlaPubYear]);
      const finalStrHtml = joinParts([authors, title ? `<i>${title}</i>` : '', translators, edABNT, mlaPubYear]);
      
      plain = ensureEndingDot(finalStrPlain);
      html = ensureEndingDot(finalStrHtml);
      break;
    }
    case 'Chicago': {
      const chiPubBlock = getPubBlockABNT(); 
      
      const finalStrPlain = joinParts([authors, title, translators, edABNT, chiPubBlock]);
      const finalStrHtml = joinParts([authors, title ? `<i>${title}</i>` : '', translators, edABNT, chiPubBlock]);
      
      plain = ensureEndingDot(finalStrPlain);
      html = ensureEndingDot(finalStrHtml);
      break;
    }
  }

  return { plain, html };
};