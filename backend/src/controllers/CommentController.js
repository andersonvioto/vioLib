const { Comment, User, Notification, Book } = require('../models');
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

    const comment = await Comment.create({
      content: content.trim(),
      UserId: userId,
      BookId: bookId
    });

    // Se o comentário não foi feito no próprio livro, notifica o dono da obra
    if (book.UserId !== userId) {
      const notification = await Notification.create({
        type: 'new_comment',
        UserId: book.UserId,
        senderId: userId,
        referenceId: bookId
      });

      const commenter = await User.findByPk(userId);

      // Emissão em Tempo Real para o dono do livro
      if (req.io) {
        req.io.to(`user_${book.UserId}`).emit('new_notification', notification);
      }

      await pushService.sendPushNotification(book.UserId, {
        title: 'Novo Comentário',
        body: `${commenter.name} comentou no seu livro "${book.title}".`,
        url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/livro/${bookId}`
      });
    }

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

    const comments = await Comment.findAll({
      where: { BookId: bookId },
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
