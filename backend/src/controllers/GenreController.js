const { Genre, sequelize } = require('../models');

/**
 * Lista todos os gêneros do usuário logado, ordenados alfabeticamente.
 * Inclui a contagem de livros associados a cada gênero.
 */
exports.list = async (req, res) => {
  try {
    const genres = await Genre.findAll({
      where: { UserId: req.userId },
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM "Book_Genres"
              WHERE "Book_Genres"."GenreId" = "Genre"."id"
            )`),
            'bookCount'
          ]
        ]
      },
      order: [['name', 'ASC']]
    });
    res.json(genres);
  } catch (error) {
    console.error('🕵️ ERRO NO GENRE CONTROLLER (LIST):', error);
    res.status(500).json({ error: 'Erro ao buscar gêneros.' });
  }
};

/**
 * Cria um novo gênero para o usuário logado, evitando duplicatas.
 */
exports.store = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'O nome é obrigatório.' });

    const [genre, created] = await Genre.findOrCreate({
      where: { name, UserId: req.userId }
    });

    if (!created) {
      return res.status(400).json({ error: 'Este gênero já está cadastrado.' });
    }

    res.status(201).json(genre);
  } catch (error) {
    console.error('🕵️ ERRO NO GENRE CONTROLLER (STORE):', error);
    res.status(500).json({ error: 'Erro ao criar gênero.' });
  }
};

/**
 * Atualiza o nome de um gênero existente pertencente ao usuário logado.
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const genre = await Genre.findOne({ where: { id, UserId: req.userId } });
    if (!genre) {
      return res.status(404).json({ error: 'Gênero não encontrado ou sem permissão.' });
    }

    genre.name = name;
    await genre.save();

    res.json(genre);
  } catch (error) {
    console.error('🕵️ ERRO NO GENRE CONTROLLER (UPDATE):', error);
    res.status(500).json({ error: 'Erro ao editar gênero.' });
  }
};

/**
 * Remove (Soft Delete) um gênero do usuário logado.
 */
exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCount = await Genre.destroy({
      where: { id, UserId: req.userId }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Gênero não encontrado ou já removido.' });
    }

    res.json({ message: 'Gênero removido com sucesso.' });
  } catch (error) {
    console.error('🕵️ ERRO NO GENRE CONTROLLER (DESTROY):', error);
    res.status(500).json({ error: 'Erro ao remover gênero.' });
  }
};
