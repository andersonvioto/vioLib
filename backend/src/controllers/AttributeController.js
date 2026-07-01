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

    // 2. Estratégia de Joins Seguros (Prevenção de Colapso SQL)
    // Para tabelas primárias (Autores, Gêneros, Tags), exigimos que tenham livros
    const requiredBookInclude = isUsedOnly ? [{ model: Book, attributes: ['id'], required: true }] : [];
    
    // Para sub-tabelas (Subgêneros), NÃO podemos exigir na query SQL, senão o banco 
    // transforma o LEFT JOIN em INNER JOIN, ocultando Gêneros inteiros.
    const optionalBookInclude = isUsedOnly ? [{ model: Book, attributes: ['id'], required: false }] : [];

    // 3. Execução em paralelo
    const [authors, translators, tags, genres] = await Promise.all([
      Author.findAll({ 
        where: { UserId: targetUserId }, 
        include: requiredBookInclude,
        order: [['name', 'ASC']] 
      }),
      Translator.findAll({ 
        where: { UserId: targetUserId }, 
        include: requiredBookInclude,
        order: [['name', 'ASC']] 
      }),
      Tag.findAll({ 
        where: { UserId: targetUserId }, 
        include: requiredBookInclude,
        order: [['name', 'ASC']] 
      }),
      Genre.findAll({
        where: { UserId: targetUserId },
        include: [
          ...requiredBookInclude,
          { 
            model: Subgenre,
            include: optionalBookInclude,
            required: false // Garante que o Gênero venha mesmo sem Subgênero
          }
        ],
        order: [
          ['name', 'ASC'],
          [Subgenre, 'name', 'ASC']
        ]
      })
    ]);

    // 4. Limpeza e Filtro Inteligente (Pós-Processamento Node.js)
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

    // Função auxiliar para limpar o objeto "Books" do payload JSON, mantendo a API rápida
    const cleanPayload = (items) => {
      return unique(items).map(item => {
        const obj = typeof item.toJSON === 'function' ? item.toJSON() : item;
        delete obj.Books; 
        return obj;
      });
    };

    const cleanGenres = unique(genres).map(g => {
      const genreObj = typeof g.toJSON === 'function' ? g.toJSON() : g;
      delete genreObj.Books; // Limpa livros do Gênero

      if (genreObj.Subgenres) {
        let subgenresList = unique(genreObj.Subgenres);

        // Se for usedOnly, filtramos pelo JS os subgêneros que efetivamente trouxeram livros
        if (isUsedOnly) {
          subgenresList = subgenresList.filter(sub => sub.Books && sub.Books.length > 0);
        }

        genreObj.Subgenres = subgenresList.map(sub => {
          delete sub.Books; // Limpa livros do Subgênero para não pesar a rede
          return sub;
        });
      }
      return genreObj;
    });

    res.json({
      authors: cleanPayload(authors),
      translators: cleanPayload(translators),
      tags: cleanPayload(tags),
      genres: cleanGenres
    });
  } catch (error) {
    console.error("🕵️ ERRO NO ATTRIBUTE CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao processar a busca de atributos do sistema.' });
  }
};