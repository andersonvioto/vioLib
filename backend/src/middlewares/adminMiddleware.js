const { User } = require('../models');

/**
 * Middleware para proteger rotas exclusivas de moderação e administração.
 * Verifica a role do utilizador diretamente no banco de dados para segurança em tempo real.
 */
module.exports = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    if (user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Acesso restrito. Apenas administradores podem executar esta ação.' });
    }

    next();
  } catch (error) {
    console.error('❌ Erro no adminMiddleware:', error);
    res.status(500).json({ error: 'Erro interno ao validar permissões de administração.' });
  }
};
