const { Op } = require('sequelize');
const { Comment, User, Notification, Book, Block } = require('../models');
const pushService = require('../services/pushService');

exports.addComment = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'O comentário não pode estar vazio.' });
    }

    const book = await Book.findByPk(bookId);
    if (!book) return res.status(404).json({ error: 'Livro não encontrado.' });

    // Intercetação UGC: Impede comentários se o dono do livro bloqueou o utilizador (ou vice-versa)
    if (book.UserId !== userId) {
      const block = await Block.findOne({
        where: {
          [Op.or]: [
            { blockerId: userId, blockedId: book.UserId },
            { blockerId: book.UserId, blockedId: userId }
          ]
        }
      });

      if (block) {
        return res.status(403).json({
          error: 'Ação restrita. Não pode comentar nesta obra devido a definições de privacidade.'
        });
      }

      const notification = await Notification.create({
        type: 'new_comment',
        UserId: book.UserId,
        senderId: userId,
        referenceId: bookId
      });

      const commenter = await User.findByPk(userId);

      if (req.io) {
        req.io.to(`user_${book.UserId}`).emit('new_notification', notification);
      }

      await pushService.sendPushNotification(book.UserId, {
        title: 'Novo Comentário',
        body: `${commenter.name} comentou no seu livro "${book.title}".`,
        url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/livro/${bookId}`
      });
    }

    const comment = await Comment.create({
      content: content.trim(),
      UserId: userId,
      BookId: bookId
    });

    const populatedComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, attributes: ['id', 'name', 'username', 'avatarUrl'] }]
    });

    res.status(201).json({ message: 'Comentário adicionado!', comment: populatedComment });
  } catch (error) {
    console.error('❌ Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro ao guardar o comentário.' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { bookId } = req.params;

    // Intercetação UGC: Descobre quem o utilizador atual bloqueou / foi bloqueado
    const blocks = await Block.findAll({
      where: {
        [Op.or]: [{ blockerId: req.userId }, { blockedId: req.userId }]
      }
    });
    const blockedUserIds = blocks.map((b) =>
      b.blockerId === req.userId ? b.blockedId : b.blockerId
    );

    // Constrói os filtros
    const whereClause = { BookId: bookId };
    if (blockedUserIds.length > 0) {
      whereClause.UserId = { [Op.notIn]: blockedUserIds };
    }

    const comments = await Comment.findAll({
      where: whereClause,
      include: [{ model: User, attributes: ['id', 'name', 'username', 'avatarUrl'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(comments);
  } catch (error) {
    console.error('❌ Erro ao buscar comentários:', error);
    res.status(500).json({ error: 'Erro ao carregar os comentários.' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // TODO FASE 4: Permitir que Admins apaguem qualquer comentário.
    // Por enquanto, apenas o dono do comentário pode apagar.
    const deleted = await Comment.destroy({
      where: { id: commentId, UserId: req.userId }
    });

    if (deleted === 0)
      return res.status(404).json({ error: 'Comentário não encontrado ou acesso negado.' });

    res.json({ message: 'Comentário apagado com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao apagar comentário:', error);
    res.status(500).json({ error: 'Erro interno ao apagar comentário.' });
  }
};
