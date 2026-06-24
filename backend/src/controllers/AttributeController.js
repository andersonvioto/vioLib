const { Author, Translator, Genre, Subgenre, Tag } = require('../models');

exports.getAllAttributes = async (req, res) => {
  try {
    const userId = req.userId;

    // Busca todas as listas exclusivas do usuário com ordenação alfabética (ASC)
    const authors = await Author.findAll({ where: { UserId: userId }, order: [['name', 'ASC']] });
    const translators = await Translator.findAll({ where: { UserId: userId }, order: [['name', 'ASC']] });
    const tags = await Tag.findAll({ where: { UserId: userId }, order: [['name', 'ASC']] });
    
    // Busca gêneros ordenados e inclui os subgêneros também ordenados!
    const genres = await Genre.findAll({
      where: { UserId: userId },
      include: [Subgenre],
      order: [
        ['name', 'ASC'], // Ordena os Gêneros
        [Subgenre, 'name', 'ASC'] // Ordena os Subgêneros dentro de cada Gênero
      ]
    });

    res.json({ authors, translators, tags, genres });
  } catch (error) {
    console.error("🕵️ ERRO NO ATTRIBUTE CONTROLLER:", error);
    res.status(500).json({ error: error.message });
  }
};