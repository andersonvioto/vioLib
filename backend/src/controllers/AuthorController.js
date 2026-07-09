const { Author } = require('../models');

/**
 * Lista todos os autores vinculados ao usuário logado, ordenados alfabeticamente.
 */
exports.list = async (req, res) => {
  try {
    const authors = await Author.findAll({
      where: { UserId: req.userId },
      order: [['name', 'ASC']]
    });
    res.json(authors);
  } catch (error) {
    console.error('🕵️ ERRO NO AUTHOR CONTROLLER (LIST):', error);
    res.status(500).json({ error: 'Erro ao listar autores.' });
  }
};

/**
 * Cria um novo autor associado ao usuário logado, prevenindo duplicatas.
 */
exports.store = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'O nome é obrigatório.' });

    const [author, created] = await Author.findOrCreate({
      where: { name, UserId: req.userId }
    });

    if (!created) {
      return res.status(400).json({ error: 'Este autor já está cadastrado para este usuário.' });
    }

    res.status(201).json(author);
  } catch (error) {
    console.error('🕵️ ERRO NO AUTHOR CONTROLLER (STORE):', error);
    res.status(500).json({ error: 'Erro ao criar autor.' });
  }
};

/**
 * Atualiza os dados de um autor específico.
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const author = await Author.findOne({ where: { id, UserId: req.userId } });
    if (!author) {
      return res.status(404).json({ error: 'Autor não encontrado ou sem permissão.' });
    }

    author.name = name;
    await author.save();

    res.json(author);
  } catch (error) {
    console.error('🕵️ ERRO NO AUTHOR CONTROLLER (UPDATE):', error);
    res.status(500).json({ error: 'Erro ao editar autor.' });
  }
};

/**
 * Desativa (Soft Delete) um autor específico.
 */
exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCount = await Author.destroy({
      where: { id, UserId: req.userId }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Autor não encontrado ou já removido.' });
    }

    res.json({ message: 'Autor removido com sucesso.' });
  } catch (error) {
    console.error('🕵️ ERRO NO AUTHOR CONTROLLER (DESTROY):', error);
    res.status(500).json({ error: 'Erro ao remover autor.' });
  }
};
