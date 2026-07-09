const axios = require('axios');
const cheerio = require('cheerio');

exports.scrapeBook = async (url) => {
  try {
    // Remove parâmetros de rastreamento para evitar bloqueios e garantir URL limpa
    const cleanUrl = url.split('?')[0];

    const { data } = await axios.get(cleanUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    const $ = cheerio.load(data);

    // Título e Subtítulo (Suporte para Desktop e Mobile)
    const title = $('#productTitle').text().trim() || $('#title').text().trim();
    const subtitle = $('#productSubtitle').text().trim();

    // Autores (Geral)
    const authors = [];
    $('.author.notFaded').each((i, el) => {
      const authorText = $(el).find('a').first().text().trim();
      if (authorText) authors.push(authorText);
    });

    // Fallback de Autores para versão Mobile
    if (authors.length === 0) {
      $('#bylineInfo a').each((i, el) => {
        const authorText = $(el).text().trim();
        if (authorText && !authors.includes(authorText)) authors.push(authorText);
      });
    }

    // Capa (Tratamento para Base64 Dinâmico da Amazon)
    let coverImage =
      $('#imgBlkFront').attr('src') ||
      $('#ebooksImgBlkFront').attr('src') ||
      $('#landingImage').attr('src');
    if (coverImage && coverImage.includes('data:image')) {
      const dynamicImages =
        $('#imgBlkFront').attr('data-a-dynamic-image') ||
        $('#ebooksImgBlkFront').attr('data-a-dynamic-image') ||
        $('#landingImage').attr('data-a-dynamic-image');
      if (dynamicImages) {
        const parsedImages = JSON.parse(dynamicImages);
        coverImage = Object.keys(parsedImages)[0];
      }
    }

    let publisher = '';
    let releaseYear = '';
    let isbn = '';
    let edition = '';

    // ========================================================================
    // TENTATIVA 1: Via RPI (Rich Product Information - Novo Padrão Amazon)
    // ========================================================================
    const getRpiValue = (attr) => $(`#rpi-attribute-${attr} .rpi-attribute-value`).text().trim();

    const rpiPublisher = getRpiValue('book_details-publisher');
    if (rpiPublisher) publisher = rpiPublisher;

    const rpiPubDate = getRpiValue('book_details-publication_date');
    if (rpiPubDate) {
      const dateMatch = rpiPubDate.match(/\b(18|19|20)\d{2}\b/);
      if (dateMatch) releaseYear = dateMatch[0];
    }

    const rpiEdition = getRpiValue('book_details-edition');
    if (rpiEdition) {
      const edMatch = rpiEdition.match(/(\d+)/);
      if (edMatch) edition = edMatch[1];
    }

    const rpiIsbn = getRpiValue('book_details-isbn13') || getRpiValue('book_details-isbn10');
    if (rpiIsbn) {
      isbn = rpiIsbn.replace(/\D/g, '');
    }

    // ========================================================================
    // TENTATIVA 2 (FALLBACK): Varredura de Bullets (Páginas antigas/misturadas)
    // ========================================================================
    const extractFromText = (text) => {
      // TRUQUE DE MESTRE: A Amazon injeta \u200E e \u200F (Marcadores LTR/RTL invisíveis).
      const cleanText = text
        .replace(/[\u200e\u200f\u202a-\u202c]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      const parts = cleanText.split(':');

      if (parts.length > 1) {
        const label = parts[0].toLowerCase();
        const value = parts.slice(1).join(':').trim();

        if (label.includes('editora')) {
          if (!publisher) publisher = value.split(';')[0].split('(')[0].trim();

          if (!edition) {
            const edMatch = value.match(/(\d+)[a-zªº]*\s*edição/i);
            if (edMatch) edition = edMatch[1];
          }
          if (!releaseYear) {
            const dateMatch = value.match(/\b(18|19|20)\d{2}\b/);
            if (dateMatch) releaseYear = dateMatch[0];
          }
        }

        if (label.includes('data') && label.includes('publicação')) {
          if (!releaseYear) {
            const dateMatch = value.match(/\b(18|19|20)\d{2}\b/);
            if (dateMatch) releaseYear = dateMatch[0];
          }
        }

        if (label.includes('edição') && !label.includes('editora')) {
          if (!edition) {
            const edMatch = value.match(/(\d+)/);
            if (edMatch) edition = edMatch[1];
          }
        }

        if (label.includes('isbn-13') || label.includes('isbn-10')) {
          if (!isbn) isbn = value.replace(/\D/g, '').trim();
        }
      }
    };

    // Varredura Desktop Clássico e Mobile
    $(
      '#detailBullets_feature_div ul li, #productDetailsTable tr, #detailBulletsWrapper_feature_div ul li, #detail-bullets table tr'
    ).each((i, el) => {
      extractFromText($(el).text());
    });

    // Guarda de Validação: Se não extraiu o título, a página não é de um livro válido ou o IP foi bloqueado.
    if (!title) {
      throw new Error(
        'Não foi possível extrair os dados. Verifique a URL ou tente novamente mais tarde (possível bloqueio de verificação da Amazon).'
      );
    }

    return { title, subtitle, authors, coverImage, publisher, releaseYear, isbn, edition };
  } catch (error) {
    console.error('🕵️ ERRO NO AMAZON SCRAPER:', error.message);
    throw new Error(error.message || 'Falha ao extrair dados da Amazon. A URL pode ser inválida.', {
      cause: error
    });
  }
};
