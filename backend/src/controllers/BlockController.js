const { Op } = require('sequelize');
const { User, Block, Friendship } = require('../models');

exports.blockUser = async (req, res) => {
  try {
    const { blockedId } = req.body;
    const blockerId = req.userId;

    if (!blockedId) {
      return res.status(400).json({ error: 'O ID do utilizador a bloquear é obrigatório.' });
    }

    if (blockerId === parseInt(blockedId, 10)) {
      return res.status(400).json({ error: 'Não pode bloquear a si mesmo.' });
    }

    const [block, created] = await Block.findOrCreate({
      where: { blockerId, blockedId }
    });

    if (!created) {
      return res.status(400).json({ error: 'Este utilizador já está bloqueado.' });
    }

    // REGRA DE OURO UGC: Ao bloquear, destruímos qualquer rastro de amizade entre os dois.
    await Friendship.destroy({
      where: {
        [Op.or]: [
          { requesterId: blockerId, receiverId: blockedId },
          { requesterId: blockedId, receiverId: blockerId }
        ]
      }
    });

    res.status(201).json({ message: 'Utilizador bloqueado com sucesso.', block });
  } catch (error) {
    console.error('❌ Erro ao bloquear utilizador:', error);
    res.status(500).json({ error: 'Erro interno ao bloquear utilizador.' });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { blockedId } = req.params;
    const blockerId = req.userId;

    const deletedCount = await Block.destroy({
      where: { blockerId, blockedId }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Bloqueio não encontrado.' });
    }

    res.json({ message: 'Utilizador desbloqueado com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao desbloquear utilizador:', error);
    res.status(500).json({ error: 'Erro interno ao desbloquear utilizador.' });
  }
};

exports.listBlockedUsers = async (req, res) => {
  try {
    const blocks = await Block.findAll({
      where: { blockerId: req.userId },
      include: [
        {
          model: User,
          as: 'Blocked',
          attributes: ['id', 'name', 'username', 'avatarUrl']
        }
      ]
    });

    res.json(blocks);
  } catch (error) {
    console.error('❌ Erro ao listar utilizadores bloqueados:', error);
    res.status(500).json({ error: 'Erro ao carregar lista de bloqueios.' });
  }
};
