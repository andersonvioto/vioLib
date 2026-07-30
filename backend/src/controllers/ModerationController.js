const { Report, User, Comment } = require('../models');

/**
 * Lista todas as denúncias, ordenadas pelas pendentes primeiro.
 */
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        { model: User, as: 'Reporter', attributes: ['id', 'name', 'username', 'email'] },
        {
          model: User,
          as: 'ReportedUser',
          attributes: ['id', 'name', 'username', 'email', 'role']
        },
        {
          model: Comment,
          attributes: ['id', 'content', 'createdAt'],
          include: [{ model: User, attributes: ['id', 'name', 'username'] }]
        }
      ],
      order: [
        // Ordena status: 'pending' (pendentes) primeiro
        ['status', 'DESC'],
        ['createdAt', 'ASC']
      ]
    });

    res.json(reports);
  } catch (error) {
    console.error('❌ Erro ao buscar denúncias:', error);
    res.status(500).json({ error: 'Erro ao carregar a lista de denúncias.' });
  }
};

/**
 * Processa a resolução de uma denúncia.
 * Ações permitidas: 'dismiss' (ignorar), 'delete_comment' (apagar comentário), 'ban_user' (banir utilizador).
 */
exports.resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action } = req.body;

    const report = await Report.findByPk(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Denúncia não encontrada.' });
    }

    if (report.status !== 'pending') {
      return res.status(400).json({ error: 'Esta denúncia já foi resolvida ou ignorada.' });
    }

    switch (action) {
      case 'dismiss': {
        // Apenas ignora a denúncia (alarme falso)
        report.status = 'dismissed';
        await report.save();
        break;
      }

      case 'delete_comment': {
        if (!report.reportedCommentId) {
          return res
            .status(400)
            .json({ error: 'Esta denúncia não está associada a um comentário.' });
        }
        await Comment.destroy({ where: { id: report.reportedCommentId } });
        report.status = 'resolved';
        await report.save();
        break;
      }

      case 'ban_user': {
        // Se a denúncia foi a um perfil, bane o perfil.
        // Se foi a um comentário, bane o autor do comentário.
        let targetUserId = report.reportedUserId;

        if (!targetUserId && report.reportedCommentId) {
          const comment = await Comment.findByPk(report.reportedCommentId);
          if (comment) targetUserId = comment.UserId;
        }

        if (!targetUserId) {
          return res
            .status(400)
            .json({ error: 'Não foi possível identificar o utilizador para banir.' });
        }

        const targetUser = await User.findByPk(targetUserId);
        if (targetUser) {
          if (targetUser.role === 'admin') {
            return res.status(403).json({ error: 'Não pode banir outro administrador.' });
          }
          targetUser.role = 'banned';
          await targetUser.save();
        }

        report.status = 'resolved';
        await report.save();
        break;
      }

      default: {
        return res.status(400).json({ error: 'Ação de moderação inválida.' });
      }
    }

    res.json({ message: 'Denúncia processada com sucesso.', report });
  } catch (error) {
    console.error('❌ Erro ao resolver denúncia:', error);
    res.status(500).json({ error: 'Erro interno ao processar a moderação.' });
  }
};
