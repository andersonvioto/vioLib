const { Op } = require('sequelize');
const { GlobalBook } = require('../models');
const axios = require('axios');

// Função auxiliar para normalizar e remover duplicatas na memória
const normalize = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Termo de busca necessário' });

    // Transforma a busca do utilizador (ex: "Dúna") em texto limpo (ex: "duna")
    const normalizedQuery = normalize(q);

    let localBooks = [];
    let googleBooks = [];
    let openLibraryBooks = [];

    // 1. Busca na Base Local (GlobalBooks)
    try {
      // PROATIVIDADE: Buscar na 'fingerprint' torna a busca case/accent insensitive e
      // pesquisa no Título e Autor simultaneamente!
      localBooks = await GlobalBook.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${q}%` } },
            { fingerprint: { [Op.like]: `%${normalizedQuery}%` } }
          ]
        },
        limit: 10
      });

      localBooks = localBooks.map((book) => {
        const b = book.toJSON();
        try {
          b.authors = JSON.parse(b.authors);
        } catch (e) {
          b.authors = [];
        }
        return b;
      });
    } catch (dbError) {
      console.error('⚠️ Erro na busca local (GlobalBooks):', dbError.message);
    }

    // 2. Busca na Google Books API
    try {
      const googleRes = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10`
      );

      if (googleRes.data && googleRes.data.items) {
        googleBooks = googleRes.data.items.map((item) => {
          const info = item.volumeInfo;
          let cUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
          if (cUrl) cUrl = cUrl.replace(/^http:/i, 'https:');

          return {
            title: info.title || '',
            authors: info.authors || [],
            publisher: info.publisher || '',
            releaseYear: info.publishedDate ? info.publishedDate.substring(0, 4) : '',
            coverImage: cUrl,
            isbn:
              info.industryIdentifiers?.find((i) => i.type === 'ISBN_13' || i.type === 'ISBN_10')
                ?.identifier || '',
            pageCount: info.pageCount || '',
            language: info.language || '',
            format: 'Livro Físico'
          };
        });
      }
    } catch (apiError) {
      console.error(`⚠️ Erro na Google API:`, apiError.message);
    }

    // 3. Busca na OpenLibrary API (O Plano B infalível)
    try {
      const olRes = await axios.get(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10`
      );

      if (olRes.data && olRes.data.docs) {
        openLibraryBooks = olRes.data.docs
          .filter((doc) => doc.title)
          .map((doc) => {
            // A OpenLibrary utiliza IDs (cover_i) para buscar as capas
            let cUrl = '';
            if (doc.cover_i) {
              cUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
            }

            return {
              title: doc.title,
              authors: doc.author_name || [],
              publisher: doc.publisher ? doc.publisher[0] : '',
              releaseYear: doc.first_publish_year ? String(doc.first_publish_year) : '',
              coverImage: cUrl,
              isbn: doc.isbn ? doc.isbn[0] : '',
              pageCount: doc.number_of_pages_median || '',
              language: doc.language ? doc.language[0] : '',
              format: 'Livro Físico'
            };
          });
      }
    } catch (olError) {
      console.error(`⚠️ Erro na OpenLibrary API:`, olError.message);
    }

    // 4. Mesclar e remover duplicados por Título
    const combined = [...localBooks, ...googleBooks, ...openLibraryBooks];
    const uniqueResults = [];
    const seenTitles = new Set();

    for (const book of combined) {
      if (!book.title) continue;

      const normalizedTitle = normalize(book.title);
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueResults.push(book);
      }
    }

    res.json(uniqueResults);
  } catch (error) {
    console.error('❌ Erro fatal no SearchController:', error);
    res.status(500).json({ error: 'Erro interno ao processar a busca.' });
  }
};
