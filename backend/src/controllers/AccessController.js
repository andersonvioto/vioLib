const { Op } = require('sequelize');
const {
  User,
  LibraryAccess,
  Book,
  Author,
  Translator,
  Genre,
  Subgenre,
  Tag,
  Loan,
  Collection,
  CollectionItem
} = require('../models');

/**
 * Concede acesso à biblioteca do usuário logado para outro usuário via e-mail.
 */
exports.shareLibrary = async (req, res) => {
  try {
    const { guestEmail, canViewLibrary = true, canViewCollections = true } = req.body;
    const currentOwnerId = req.userId;

    const owner = await User.findByPk(currentOwnerId);
    if (!owner) return res.status(404).json({ error: 'Usuário proprietário não encontrado.' });

    if (owner.email === guestEmail) {
      return res
        .status(400)
        .json({ error: 'Você não pode compartilhar a biblioteca consigo mesmo.' });
    }

    const guest = await User.findOne({ where: { email: guestEmail } });
    if (!guest) {
      return res.status(404).json({ error: 'Usuário não encontrado com este e-mail.' });
    }

    const existingAccess = await LibraryAccess.findOne({
      where: { ownerId: currentOwnerId, guestId: guest.id }
    });

    if (existingAccess) {
      return res
        .status(400)
        .json({ error: 'Você já compartilhou sua biblioteca com esta pessoa.' });
    }

    await LibraryAccess.create({
      ownerId: currentOwnerId,
      guestId: guest.id,
      canViewLibrary,
      canViewCollections
    });

    res.status(201).json({ message: `Acesso concedido a ${guest.name} com sucesso!` });
  } catch (error) {
    console.error('❌ ERRO AO COMPARTILHAR BIBLIOTECA:', error);
    res.status(500).json({ error: 'Erro interno ao realizar o compartilhamento.' });
  }
};

/**
 * Atualiza as permissões de um convidado.
 */
exports.updateAccess = async (req, res) => {
  try {
    const { guestId } = req.params;
    const { canViewLibrary, canViewCollections } = req.body;

    const access = await LibraryAccess.findOne({
      where: { ownerId: req.userId, guestId }
    });

    if (!access) return res.status(404).json({ error: 'Acesso não encontrado.' });

    access.canViewLibrary = canViewLibrary;
    access.canViewCollections = canViewCollections;
    await access.save();

    res.json({ message: 'Permissões atualizadas com sucesso.', access });
  } catch (error) {
    console.error('❌ ERRO AO ATUALIZAR PERMISSÕES:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar as permissões.' });
  }
};

/**
 * Lista as bibliotecas que foram compartilhadas com o usuário logado (ele como convidado).
 */
exports.getSharedWithMe = async (req, res) => {
  try {
    const accesses = await LibraryAccess.findAll({
      where: { guestId: req.userId },
      include: [{ model: User, as: 'Owner', attributes: ['id', 'name', 'email'] }]
    });
    res.json(accesses);
  } catch (error) {
    console.error('❌ ERRO AO BUSCAR COMPARTILHADOS:', error);
    res.status(500).json({ error: 'Erro ao buscar bibliotecas compartilhadas.' });
  }
};

/**
 * Lista todas as pessoas que receberam acesso à biblioteca do usuário logado.
 */
exports.getMyShares = async (req, res) => {
  try {
    const shares = await LibraryAccess.findAll({
      where: { ownerId: req.userId },
      include: [{ model: User, as: 'Guest', attributes: ['id', 'name', 'email'] }]
    });
    res.json(shares);
  } catch (error) {
    console.error('🕵️ ERRO NO ACCESS CONTROLLER:', error);
    res.status(500).json({ error: 'Erro ao buscar compartilhamentos realizados.' });
  }
};

/**
 * Revoga o acesso de um convidado específico à biblioteca do usuário logado.
 */
exports.revokeAccess = async (req, res) => {
  try {
    const { guestId } = req.params;

    const deletedCount = await LibraryAccess.destroy({
      where: { ownerId: req.userId, guestId }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Acesso não encontrado ou já revogado.' });
    }

    res.json({ message: 'Acesso revogado com sucesso.' });
  } catch (error) {
    console.error('🕵️ ERRO NO REVOKE ACCESS:', error);
    res.status(500).json({ error: 'Erro ao revogar acesso.' });
  }
};

/**
 * ============================================================================
 * ROTAS DE LEITURA PARA CONVIDADOS (Com Verificação de Permissões)
 * ============================================================================
 */

exports.getSharedBooks = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const access = await LibraryAccess.findOne({
      where: { ownerId, guestId: req.userId }
    });

    if (!access)
      return res.status(403).json({ error: 'Você não tem permissão para ver este usuário.' });
    if (!access.canViewLibrary)
      return res
        .status(403)
        .json({ error: 'O proprietário desativou o seu acesso à Biblioteca Principal.' });

    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'title',
      order = 'ASC',
      genre = '',
      subgenre = '',
      tag = '',
      borrowed = 'false'
    } = req.query;
    const offset = (page - 1) * limit;
    const bookWhere = { UserId: ownerId };

    if (search) bookWhere.title = { [Op.like]: `%${search}%` };

    const orderClause =
      sortBy === 'author'
        ? [
            [Author, 'name', order],
            ['title', 'ASC']
          ]
        : sortBy === 'releaseYear'
          ? [
              ['releaseYear', order],
              ['title', 'ASC']
            ]
          : [['title', order]];

    const { count, rows } = await Book.findAndCountAll({
      where: bookWhere,
      include: [
        { model: Author },
        { model: Translator },
        { model: Subgenre, where: subgenre ? { name: subgenre } : undefined, required: !!subgenre },
        { model: Genre, where: genre ? { name: genre } : undefined, required: !!genre },
        { model: Tag, where: tag ? { name: tag } : undefined, required: !!tag },
        {
          model: Loan,
          where: borrowed === 'true' ? { returnDate: null } : undefined,
          required: borrowed === 'true'
        }
      ],
      order: orderClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      distinct: true
    });

    res.json({
      books: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10)
    });
  } catch (error) {
    console.error('🕵️ ERRO EM SHARED BOOKS:', error);
    res.status(500).json({ error: 'Erro ao processar a busca na biblioteca compartilhada.' });
  }
};

exports.getSharedCollections = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const access = await LibraryAccess.findOne({
      where: { ownerId, guestId: req.userId }
    });

    if (!access)
      return res.status(403).json({ error: 'Você não tem permissão para ver este usuário.' });
    if (!access.canViewCollections)
      return res.status(403).json({ error: 'O proprietário desativou o seu acesso às Coleções.' });

    const collections = await Collection.findAll({
      where: { UserId: ownerId },
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
    console.error('❌ ERRO EM SHARED COLLECTIONS:', error);
    res.status(500).json({ error: 'Erro ao buscar as coleções compartilhadas.' });
  }
};

exports.getSharedCollectionById = async (req, res) => {
  try {
    const { ownerId, collectionId } = req.params;

    const access = await LibraryAccess.findOne({
      where: { ownerId, guestId: req.userId }
    });

    if (!access)
      return res.status(403).json({ error: 'Você não tem permissão para ver este usuário.' });
    if (!access.canViewCollections)
      return res.status(403).json({ error: 'O proprietário desativou o seu acesso às Coleções.' });

    const collection = await Collection.findOne({
      where: { id: collectionId, UserId: ownerId },
      include: [
        {
          model: CollectionItem,
          include: [{ model: Book, attributes: ['id', 'title', 'coverImage'] }]
        }
      ]
    });

    if (!collection)
      return res.status(404).json({ error: 'Coleção não encontrada no acervo deste usuário.' });

    const plainCol = collection.toJSON();
    const items = plainCol.CollectionItems;
    let totalItems = items.length;
    let ownedItems = 0;
    const axisStats = {};

    plainCol.customAxes.forEach((axis) => {
      axisStats[axis] = {};
    });

    items.forEach((item) => {
      const isOwned = item.status !== 'missing';
      if (isOwned) ownedItems++;
      plainCol.customAxes.forEach((axis) => {
        const axisValue = item.axisValues[axis] || 'Não categorizado';
        if (!axisStats[axis][axisValue]) {
          axisStats[axis][axisValue] = { total: 0, owned: 0 };
        }
        axisStats[axis][axisValue].total++;
        if (isOwned) axisStats[axis][axisValue].owned++;
      });
    });

    res.json({
      ...plainCol,
      stats: {
        totalItems,
        ownedItems,
        progress: totalItems === 0 ? 0 : Math.round((ownedItems / totalItems) * 100),
        axisStats
      }
    });
  } catch (error) {
    console.error('❌ ERRO EM SHARED COLLECTION DETAILS:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes da coleção compartilhada.' });
  }
};
