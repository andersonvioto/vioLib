const { Author, Translator, Genre, Subgenre, Tag } = require('../models');

exports.getAllAttributes = async (req, res) => {
  try {
    const userId = req.userId;

    // Busca todas as listas exclusivas do usuário de uma só vez
    const authors = await Author.findAll({ where: { UserId: userId } });
    const translators = await Translator.findAll({ where: { UserId: userId } });
    const tags = await Tag.findAll({ where: { UserId: userId } });
    
    // Busca gêneros e já inclui os subgêneros vinculados a eles
    const genres = await Genre.findAll({
      where: { UserId: userId },
      include: [Subgenre]
    });

    res.json({ authors, translators, tags, genres });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};