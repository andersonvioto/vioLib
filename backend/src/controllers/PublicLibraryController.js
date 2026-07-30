const { Op } = require('sequelize');
const {
  User,
  Book,
  Friendship,
  Collection,
  CollectionItem,
  Author,
  Translator,
  Genre,
  Subgenre,
  Tag,
  Loan
} = require('../models');

/**
 * Novo Controlador para substituir o AccessController.
 * Implementa a regra rigorosa de Privacidade Global.
 */

// Helper para validar a amizade antes de exibir dados
const checkFriendship = async (userId, friendId) => {
  if (userId === parseInt(friendId, 10)) return true; // Eu vejo as minhas próprias coisas

  const friendship = await Friendship.findOne({
    where: {
      status: 'accepted',
      [Op.or]: [
        { requesterId: userId, receiverId: friendId },
        { requesterId: friendId, receiverId: userId }
      ]
    }
  });
  return !!friendship;
};

exports.getFriendBooks = async (req, res) => {
  try {
    const { friendId } = req.params;
    const { page = 1, limit = 20, search = '' } = req.query;

    const isFriend = await checkFriendship(req.userId, friendId);
    if (!isFriend) {
      return res
        .status(403)
        .json({ error: 'Acesso negado. Apenas amigos podem visualizar esta biblioteca.' });
    }

    const friend = await User.findByPk(friendId, {
      attributes: ['id', 'name', 'username', 'shareReadingStatus', 'shareNotes']
    });

    if (!friend) return res.status(404).json({ error: 'Utilizador não encontrado.' });

    const offset = (page - 1) * limit;
    const bookWhere = { UserId: friendId };

    if (search) bookWhere.title = { [Op.like]: `%${search}%` };

    const { count, rows } = await Book.findAndCountAll({
      where: bookWhere,
      include: [
        { model: Author },
        { model: Translator },
        { model: Subgenre },
        { model: Genre },
        { model: Tag },
        { model: Loan }
      ],
      order: [['title', 'ASC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      distinct: true
    });

    // MÁGICA DA PRIVACIDADE: Oculta campos baseados nas preferências do utilizador alvo
    const sanitizedBooks = rows.map((book) => {
      const b = book.toJSON();
      if (!friend.shareReadingStatus) delete b.readingStatus;
      if (!friend.shareNotes) delete b.notes;
      return b;
    });

    res.json({
      owner: { name: friend.name, username: friend.username },
      books: sanitizedBooks,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10)
    });
  } catch (error) {
    console.error('❌ Erro ao buscar livros do amigo:', error);
    res.status(500).json({ error: 'Erro ao carregar a biblioteca.' });
  }
};

exports.getFriendCollections = async (req, res) => {
  try {
    const { friendId } = req.params;

    const isFriend = await checkFriendship(req.userId, friendId);
    if (!isFriend) return res.status(403).json({ error: 'Acesso negado.' });

    const friend = await User.findByPk(friendId, { attributes: ['id', 'shareCollections'] });

    if (!friend.shareCollections) {
      return res
        .status(403)
        .json({ error: 'Este utilizador configurou as suas coleções como privadas.' });
    }

    const collections = await Collection.findAll({
      where: { UserId: friendId },
      include: [{ model: CollectionItem, attributes: ['id', 'status'] }],
      order: [['createdAt', 'DESC']]
    });

    const enrichedCollections = collections.map((col) => {
      const plainCol = col.toJSON();
      const totalItems = plainCol.CollectionItems.length;
      const ownedItems = plainCol.CollectionItems.filter((i) => i.status !== 'missing').length;
      const progress = totalItems === 0 ? 0 : Math.round((ownedItems / totalItems) * 100);
      delete plainCol.CollectionItems;
      return { ...plainCol, stats: { totalItems, ownedItems, progress } };
    });

    res.json(enrichedCollections);
  } catch (error) {
    console.error('❌ Erro ao buscar coleções do amigo:', error);
    res.status(500).json({ error: 'Erro ao carregar as coleções.' });
  }
};
