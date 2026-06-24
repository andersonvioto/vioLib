const { Translator } = require('../models');

/**
 * Lista todos os tradutores do usuário logado, ordenados alfabeticamente.
 */
exports.list = async (req, res) => {
  try {
    const translators = await Translator.findAll({ 
      where: { UserId: req.userId },
      order: [['name', 'ASC']] 
    });
    res.json(translators);
  } catch (error) {
    console.error("🕵️ ERRO NO TRANSLATOR CONTROLLER (LIST):", error);
    res.status(500).json({ error: 'Erro ao listar tradutores.' });
  }
};

/**
 * Cria um novo tradutor vinculado ao usuário logado, prevenindo duplicatas.
 */
exports.store = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'O nome é obrigatório.' });
    
    const [translator, created] = await Translator.findOrCreate({
      where: { name, UserId: req.userId }
    });

    if (!created) {
      return res.status(400).json({ error: 'Este tradutor já está cadastrado para você.' });
    }

    res.status(201).json(translator);
  } catch (error) {
    console.error("🕵️ ERRO NO TRANSLATOR CONTROLLER (STORE):", error);
    res.status(500).json({ error: 'Erro ao criar tradutor.' });
  }
};

/**
 * Atualiza o nome de um tradutor existente, validando a posse.
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const translator = await Translator.findOne({ where: { id, UserId: req.userId } });
    if (!translator) {
      return res.status(404).json({ error: 'Tradutor não encontrado ou sem permissão.' });
    }

    translator.name = name;
    await translator.save();
    
    res.json(translator);
  } catch (error) {
    console.error("🕵️ ERRO NO TRANSLATOR CONTROLLER (UPDATE):", error);
    res.status(500).json({ error: 'Erro ao editar tradutor.' });
  }
};

/**
 * Remove (Soft Delete) um tradutor pertencente ao usuário logado.
 */
exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedCount = await Translator.destroy({ 
      where: { id, UserId: req.userId } 
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Tradutor não encontrado ou já removido.' });
    }

    res.json({ message: 'Tradutor removido com sucesso.' });
  } catch (error) {
    console.error("🕵️ ERRO NO TRANSLATOR CONTROLLER (DESTROY):", error);
    res.status(500).json({ error: 'Erro ao remover tradutor.' });
  }
};