const { Subgenre, Genre, sequelize } = require('../models');

/**
 * Lista todos os subgêneros do usuário logado através da relação com o gênero pai.
 * Inclui a contagem de livros vinculados a cada subgênero.
 */
exports.list = async (req, res) => {
  try {
    const subgenres = await Subgenre.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM "Book_Subgenres"
              WHERE "Book_Subgenres"."SubgenreId" = "Subgenre"."id"
            )`),
            'bookCount'
          ]
        ]
      },
      include: [
        {
          model: Genre,
          where: { UserId: req.userId },
          attributes: []
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json(subgenres);
  } catch (error) {
    console.error('🕵️ ERRO NO SUBGENRE CONTROLLER (LIST):', error);
    res.status(500).json({ error: 'Erro ao listar subgêneros.' });
  }
};

/**
 * Cria um novo subgênero, validando que o Gênero pai pertence ao usuário.
 */
exports.store = async (req, res) => {
  try {
    const { name, GenreId } = req.body;
    if (!name || !GenreId) {
      return res.status(400).json({ error: 'Nome e Gênero pai são obrigatórios.' });
    }

    const genre = await Genre.findOne({ where: { id: GenreId, UserId: req.userId } });
    if (!genre) return res.status(403).json({ error: 'Gênero inválido ou sem permissão.' });

    const [subgenre, created] = await Subgenre.findOrCreate({
      where: { name, GenreId }
    });

    if (!created) {
      return res.status(400).json({ error: 'Este subgênero já existe para este gênero.' });
    }

    res.status(201).json(subgenre);
  } catch (error) {
    console.error('🕵️ ERRO NO SUBGENRE CONTROLLER (STORE):', error);
    res.status(500).json({ error: 'Erro ao criar subgênero.' });
  }
};

/**
 * Atualiza o nome de um subgênero, validando a posse.
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const subgenre = await Subgenre.findByPk(id, {
      include: [{ model: Genre, attributes: ['UserId'] }]
    });

    if (!subgenre) return res.status(404).json({ error: 'Subgênero não encontrado.' });
    if (subgenre.Genre.UserId !== req.userId)
      return res.status(403).json({ error: 'Acesso negado.' });

    subgenre.name = name;
    await subgenre.save();

    res.json(subgenre);
  } catch (error) {
    console.error('🕵️ ERRO NO SUBGENRE CONTROLLER (UPDATE):', error);
    res.status(500).json({ error: 'Erro ao editar subgênero.' });
  }
};

/**
 * Remove um subgênero, validando a posse.
 */
exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;

    const subgenre = await Subgenre.findByPk(id, {
      include: [{ model: Genre, attributes: ['UserId'] }]
    });

    if (!subgenre) return res.status(404).json({ error: 'Subgênero não encontrado.' });
    if (subgenre.Genre.UserId !== req.userId)
      return res.status(403).json({ error: 'Acesso negado.' });

    await subgenre.destroy();
    res.json({ message: 'Subgênero removido com sucesso.' });
  } catch (error) {
    console.error('🕵️ ERRO NO SUBGENRE CONTROLLER (DESTROY):', error);
    res.status(500).json({ error: 'Erro ao remover subgênero.' });
  }
};
