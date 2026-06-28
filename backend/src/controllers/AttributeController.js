const { Author, Translator, Genre, Subgenre, Tag, Book, LibraryAccess } = require('../models');

/**
 * Busca os atributos de metadados do sistema.
 * Agora suporta filtros dinâmicos de contexto:
 * @query {boolean} usedOnly - Se 'true', retorna APENAS atributos vinculados a algum livro.
 * @query {number} ownerId - ID do dono da biblioteca (para visualizar acervos compartilhados).
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

    // 2. Lógica de Junção (INNER JOIN) caso queira apenas categorias em uso
    const bookInclude = isUsedOnly ? [{ model: Book, attributes: [], required: true }] : [];

    // 3. Execução em paralelo
    const [authors, translators, tags, genres] = await Promise.all([
      Author.findAll({ 
        where: { UserId: targetUserId }, 
        include: bookInclude,
        order: [['name', 'ASC']] 
      }),
      Translator.findAll({ 
        where: { UserId: targetUserId }, 
        include: bookInclude,
        order: [['name', 'ASC']] 
      }),
      Tag.findAll({ 
        where: { UserId: targetUserId }, 
        include: bookInclude,
        order: [['name', 'ASC']] 
      }),
      Genre.findAll({
        where: { UserId: targetUserId },
        include: [
          ...bookInclude,
          { 
            model: Subgenre,
            include: bookInclude,
            // Não exige que o Gênero tenha obrigatoriamente um Subgênero
            required: false 
          }
        ],
        order: [
          ['name', 'ASC'],
          [Subgenre, 'name', 'ASC']
        ]
      })
    ]);

    // 4. Limpeza de duplicatas geradas pelo INNER JOIN em relacionamentos N:N
    const unique = (arr) => {
      if (!arr) return [];
      const seen = new Set();
      return arr.filter(item => {
        const identifier = item.id || item.name;
        if (seen.has(identifier)) return false;
        seen.add(identifier);
        return true;
      });
    };

    const cleanGenres = unique(genres).map(g => {
      const genreObj = typeof g.toJSON === 'function' ? g.toJSON() : g;
      if (isUsedOnly && genreObj.Subgenres) {
        genreObj.Subgenres = unique(genreObj.Subgenres);
      }
      return genreObj;
    });

    res.json({
      authors: unique(authors),
      translators: unique(translators),
      tags: unique(tags),
      genres: cleanGenres
    });
  } catch (error) {
    console.error("🕵️ ERRO NO ATTRIBUTE CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao processar a busca de atributos do sistema.' });
  }
};