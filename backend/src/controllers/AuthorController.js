const { Author } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const authors = await Author.findAll({ where: { UserId: req.userId } });
    res.json(authors);
  } catch (error) {
    console.error("🕵️ ERRO NO AUTHOR CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao buscar autores.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    // O .destroy() agora é um Soft Delete automático!
    const deletedCount = await Author.destroy({ 
      where: { id, UserId: req.userId } // Garante que ele só desativa os próprios autores
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Autor não encontrado ou já desativado.' });
    }

    res.json({ message: 'Autor desativado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao desativar autor.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'O nome é obrigatório.' });
    
    // Cria o registro associando ao usuário logado
    const novoItem = await Author.create({ name, UserId: req.userId });
    res.status(201).json(novoItem);
  } catch (error) {
    console.error("Erro no Create:", error);
    res.status(500).json({ error: 'Erro ao criar registro.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Busca o item garantindo que ele pertence a este usuário
    const item = await Author.findOne({ where: { id, UserId: req.userId } });
    if (!item) return res.status(404).json({ error: 'Registro não encontrado ou sem permissão.' });

    item.name = name;
    await item.save();
    
    res.json(item);
  } catch (error) {
    console.error("Erro no Update:", error);
    res.status(500).json({ error: 'Erro ao editar registro.' });
  }
};