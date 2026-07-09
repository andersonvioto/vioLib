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
  Loan
} = require('../models');

/**
 * Concede acesso à biblioteca do usuário logado para outro usuário via e-mail.
 */
exports.shareLibrary = async (req, res) => {
  try {
    const { guestEmail } = req.body;
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

    await LibraryAccess.create({ ownerId: currentOwnerId, guestId: guest.id });
    res.status(201).json({ message: `Biblioteca compartilhada com ${guest.name} com sucesso!` });
  } catch (error) {
    console.error('❌ ERRO AO COMPARTILHAR BIBLIOTECA:', error);
    res.status(500).json({ error: 'Erro interno ao realizar o compartilhamento.' });
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
 * Retorna os livros de uma biblioteca compartilhada aplicando o Motor de Busca Avançada.
 * Respeita paginação, filtros por gênero, subgênero, tags, empréstimos e ordenação.
 */
exports.getSharedBooks = async (req, res) => {
  try {
    const { ownerId } = req.params;

    // 1. Validação de Segurança
    const hasAccess = await LibraryAccess.findOne({
      where: { ownerId, guestId: req.userId }
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Você não tem permissão para ver esta biblioteca.' });
    }

    // 2. Extração dos Parâmetros de Filtro (Igual ao BookController)
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

    // 3. Busca Paginada e Filtrada
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
      distinct: true // Evita a contagem duplicada caso o livro tenha várias tags/autores
    });

    res.json({
      books: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10)
    });
  } catch (error) {
    console.error('🕵️ ERRO NO MOTOR DE BUSCA (ACCESS CONTROLLER):', error);
    res
      .status(500)
      .json({ error: 'Erro ao processar a busca avançada na biblioteca compartilhada.' });
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
      where: {
        ownerId: req.userId,
        guestId
      }
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
