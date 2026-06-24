const { Author, Translator, Genre, Subgenre, Tag } = require('../models');

/**
 * Busca todos os atributos de metadados do usuário logado (Autores, Tradutores, Tags e Gêneros).
 * Os gêneros incluem seus respectivos subgêneros, todos ordenados alfabeticamente.
 * * @returns {Object} Contendo arrays de: authors, translators, tags, genres.
 */
exports.getAllAttributes = async (req, res) => {
  try {
    const { userId } = req;

    // Executa todas as buscas em paralelo para otimizar o tempo de resposta (Performance)
    const [authors, translators, tags, genres] = await Promise.all([
      Author.findAll({ 
        where: { UserId: userId }, 
        order: [['name', 'ASC']] 
      }),
      Translator.findAll({ 
        where: { UserId: userId }, 
        order: [['name', 'ASC']] 
      }),
      Tag.findAll({ 
        where: { UserId: userId }, 
        order: [['name', 'ASC']] 
      }),
      Genre.findAll({
        where: { UserId: userId },
        include: [{ 
          model: Subgenre 
        }],
        order: [
          ['name', 'ASC'],
          [Subgenre, 'name', 'ASC']
        ]
      })
    ]);

    res.json({
      authors,
      translators,
      tags,
      genres
    });
  } catch (error) {
    console.error("🕵️ ERRO NO ATTRIBUTE CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao processar a busca de atributos do sistema.' });
  }
};