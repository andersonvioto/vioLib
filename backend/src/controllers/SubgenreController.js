const { Subgenre, Genre } = require('../models');

exports.getAll = async (req, res) => {
  try {
    // Busca os subgêneros fazendo um "JOIN" (include) com o Gênero do usuário logado
    const subgenres = await Subgenre.findAll({
      include: [{
        model: Genre,
        where: { UserId: req.userId }, // O filtro mágico acontece na tabela do pai!
        attributes: [] // Opcional: esconde os dados do gênero para não poluir o JSON
      }]
    });
    
    res.json(subgenres);
  } catch (error) {
    console.error("🕵️ ERRO NO SUBGENRE CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao buscar subgêneros.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params; 

    // 1. Busca o subgênero e inclui o Gênero pai para verificar o dono
    const subgenre = await Subgenre.findByPk(id, {
      include: [{ model: Genre, attributes: ['UserId'] }]
    });

    if (!subgenre) {
      return res.status(404).json({ error: 'Subgênero não encontrado.' });
    }

    // 2. Trava de segurança: Garante que o subgênero pertence a um gênero do usuário logado
    if (subgenre.Genre.UserId !== req.userId) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    // 3. O .destroy() aplica o Soft Delete (paranoid)
    await subgenre.destroy();

    res.json({ message: 'Subgênero desativado com sucesso.' });
  } catch (error) {
    console.error("🕵️ ERRO NO SUBGENRE CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao desativar subgênero.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, GenreId } = req.body;
    if (!name || !GenreId) return res.status(400).json({ error: 'Nome e Gênero pai são obrigatórios.' });

    // 1. Opcional, mas seguro: Checar se o Gênero pertence a esse usuário
    const genre = await Genre.findOne({ where: { id: GenreId, UserId: req.userId } });
    if (!genre) return res.status(403).json({ error: 'Gênero inválido.' });

    // 2. Cria o subgênero
    const newSubgenre = await Subgenre.create({ name, GenreId });
    res.status(201).json(newSubgenre);
  } catch (error) {
    console.error("🕵️ ERRO NO SUBGENRE CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao criar subgênero.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Traz o Subgênero junto com o Gênero para checar a permissão
    const subgenre = await Subgenre.findByPk(id, {
      include: [{ model: Genre, attributes: ['UserId'] }]
    });

    if (!subgenre) return res.status(404).json({ error: 'Subgênero não encontrado.' });
    if (subgenre.Genre.UserId !== req.userId) return res.status(403).json({ error: 'Acesso negado.' });

    subgenre.name = name;
    await subgenre.save();
    
    res.json(subgenre);
  } catch (error) {
    console.error("🕵️ ERRO NO SUBGENRE CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao editar subgênero.' });
  }
};