const { Author, Translator, Genre, Subgenre, Tag, Book, LibraryAccess } = require('../models');

/**
 * Busca os atributos de metadados do sistema.
 * Otimizado com montagem de árvore em memória para evitar Explosão Cartesiana no SQL.
 */
exports.getAllAttributes = async (req, res) => {
  try {
    const { usedOnly, ownerId } = req.query;
    let targetUserId = req.userId;

    // 1. Validação de Segurança para Bibliotecas Compartilhadas
    if (ownerId && parseInt(ownerId, 10) !== req.userId) {
      const hasAccess = await LibraryAccess.findOne({
        where: { ownerId: parseInt(ownerId, 10), guestId: req.userId }
      });
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado aos atributos desta biblioteca.' });
      }
      targetUserId = parseInt(ownerId, 10);
    }

    const isUsedOnly = usedOnly === 'true';

    // 2. Estratégia de Join Otimizado (MÁXIMA PERFORMANCE)
    // Se "usedOnly" for true, fazemos o INNER JOIN (required: true), mas
    // PROIBIMOS o banco de transferir os dados do livro ou da tabela de ligação.
    const includeOptions = isUsedOnly
      ? [
          {
            model: Book,
            attributes: [], // NENHUM dado do livro é trafegado pela rede
            through: { attributes: [] }, // NENHUM dado da tabela de ligação é trafegado
            required: true // INNER JOIN: Retorna apenas se existir relação
          }
        ]
      : [];

    // 3. Execução das Consultas em Paralelo
    const [authors, translators, tags, genres, subgenres] = await Promise.all([
      Author.findAll({
        where: { UserId: targetUserId },
        include: includeOptions,
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      }),
      Translator.findAll({
        where: { UserId: targetUserId },
        include: includeOptions,
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      }),
      Tag.findAll({
        where: { UserId: targetUserId },
        include: includeOptions,
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      }),
      Genre.findAll({
        where: { UserId: targetUserId },
        include: includeOptions,
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      }),
      Subgenre.findAll({
        include: [
          // Filtro para garantir que o subgênero pertence a um Gênero deste usuário
          { model: Genre, where: { UserId: targetUserId }, attributes: [] },
          ...includeOptions
        ],
        attributes: ['id', 'name', 'GenreId'], // Trazemos o GenreId para montar a árvore no JS
        order: [['name', 'ASC']]
      })
    ]);

    // 4. Pós-Processamento Rápido na Memória (O(N))
    const unique = (arr) => {
      if (!arr) return [];
      const seen = new Set();
      return arr.filter((item) => {
        const identifier = item.id || item.name;
        if (seen.has(identifier)) return false;
        seen.add(identifier);
        return true;
      });
    };

    const cleanPayload = (items) => {
      return unique(items).map((item) => {
        const obj = typeof item.toJSON === 'function' ? item.toJSON() : item;
        delete obj.Books; // Limpeza de segurança caso o Sequelize insira arrays vazios
        return obj;
      });
    };

    // 5. Montagem da Árvore de Gêneros e Subgêneros (Evitando N+1 e Produtos Cartesianos)
    const genresMap = {};
    const cleanGenres = [];

    // Inicializa o dicionário (Hash Map)
    unique(genres).forEach((g) => {
      const genreData = typeof g.toJSON === 'function' ? g.toJSON() : g;
      delete genreData.Books;
      genreData.Subgenres = [];
      genresMap[genreData.id] = genreData;
      cleanGenres.push(genreData);
    });

    // Anexa os subgêneros instantaneamente através da chave do dicionário
    unique(subgenres).forEach((s) => {
      const subData = typeof s.toJSON === 'function' ? s.toJSON() : s;
      delete subData.Books;
      delete subData.Genre;

      if (genresMap[subData.GenreId]) {
        genresMap[subData.GenreId].Subgenres.push(subData);
      }
    });

    res.json({
      authors: cleanPayload(authors),
      translators: cleanPayload(translators),
      tags: cleanPayload(tags),
      genres: cleanGenres
    });
  } catch (error) {
    console.error('🕵️ ERRO NO ATTRIBUTE CONTROLLER:', error);
    res.status(500).json({ error: 'Erro ao processar a busca de atributos do sistema.' });
  }
};
