const { Report, User, Comment } = require('../models');

exports.createReport = async (req, res) => {
  try {
    const { reportedUserId, reportedCommentId, reason } = req.body;
    const reporterId = req.userId;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'O motivo da denúncia é obrigatório.' });
    }

    if (!reportedUserId && !reportedCommentId) {
      return res
        .status(400)
        .json({ error: 'Deve especificar um utilizador ou comentário para denunciar.' });
    }

    if (reportedUserId && reportedUserId === reporterId) {
      return res.status(400).json({ error: 'Não pode denunciar-se a si mesmo.' });
    }

    // Validação de Entidades
    if (reportedUserId) {
      const userExists = await User.findByPk(reportedUserId);
      if (!userExists)
        return res.status(404).json({ error: 'Utilizador denunciado não encontrado.' });
    }

    if (reportedCommentId) {
      const commentExists = await Comment.findByPk(reportedCommentId);
      if (!commentExists)
        return res.status(404).json({ error: 'Comentário denunciado não encontrado.' });
      if (commentExists.UserId === reporterId) {
        return res.status(400).json({ error: 'Não pode denunciar o seu próprio comentário.' });
      }
    }

    // Prevenção de Spam: Verifica se este utilizador já fez uma denúncia pendente para o mesmo alvo
    const existingReport = await Report.findOne({
      where: {
        reporterId,
        reportedUserId: reportedUserId || null,
        reportedCommentId: reportedCommentId || null,
        status: 'pending'
      }
    });

    if (existingReport) {
      return res
        .status(400)
        .json({ error: 'Já existe uma denúncia sua pendente de análise para este conteúdo.' });
    }

    const report = await Report.create({
      reporterId,
      reportedUserId: reportedUserId || null,
      reportedCommentId: reportedCommentId || null,
      reason: reason.trim(),
      status: 'pending'
    });

    res.status(201).json({
      message: 'A sua denúncia foi enviada com sucesso e será analisada pela nossa equipa.',
      report
    });
  } catch (error) {
    console.error('❌ Erro ao criar denúncia:', error);
    res.status(500).json({ error: 'Erro interno ao processar a denúncia.' });
  }
};
