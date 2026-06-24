const { Op } = require('sequelize');
const { Book, Author, Translator, Genre, Subgenre, Tag, Loan, LibraryAccess } = require('../models');

/**
 * Helper para processar associações N:N (Autores, Tags, etc.)
 */
const processRelations = async (book, items, Model, userId, associationMethod) => {
  if (items && items.length > 0) {
    const instances = await Promise.all(items.map(async (itemName) => {
      const [instance] = await Model.findOrCreate({ where: { name: itemName, UserId: userId } });
      return instance;
    }));
    await book[associationMethod](instances);
  } else {
    await book[associationMethod]([]);
  }
};

/**
 * Cria um novo livro e suas associações iniciais.
 */
exports.createBook = async (req, res) => {
  try {
    const userId = req.userId;
    const { isbn, title, edition, releaseYear, publisher, publicationLocation, acquisitionDate, notes } = req.body;

    const authors = req.body.authors ? JSON.parse(req.body.authors) : [];
    const translators = req.body.translators ? JSON.parse(req.body.translators) : [];
    const genres = req.body.genres ? JSON.parse(req.body.genres) : [];
    const subgenres = req.body.subgenres ? JSON.parse(req.body.subgenres) : [];
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    const book = await Book.create({
      isbn: isbn || null,
      title,
      edition: edition || null,
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
      publicationLocation: publicationLocation || null,
      publisher: publisher || null,
      acquisitionDate: acquisitionDate || null,
      notes: notes || null,
      coverImage: req.file ? req.file.path : null,
      UserId: userId
    });

    await processRelations(book, authors, Author, userId, 'addAuthors');
    await processRelations(book, translators, Translator, userId, 'addTranslators');
    await processRelations(book, genres, Genre, userId, 'addGenres');
    await processRelations(book, tags, Tag, userId, 'addTags');

    if (subgenres?.length > 0) {
      await book.addSubgenres(subgenres.map(id => parseInt(id, 10)));
    }

    res.status(201).json({ message: 'Livro cadastrado com sucesso!', book });
  } catch (error) {
    console.error('❌ ERRO AO SALVAR LIVRO:', error);
    res.status(500).json({ error: 'Erro ao salvar o livro.' });
  }
};

/**
 * Busca livros com suporte a filtros, ordenação e paginação.
 */
exports.getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'title', order = 'ASC', genre = '', subgenre = '', tag = '', borrowed = 'false' } = req.query;
    
    const offset = (page - 1) * limit;
    const bookWhere = { UserId: req.userId };

    if (search) bookWhere.title = { [Op.like]: `%${search}%` };

    const orderClause = sortBy === 'author' 
      ? [[Author, 'name', order], ['title', 'ASC']] 
      : sortBy === 'releaseYear' 
      ? [['releaseYear', order], ['title', 'ASC']] 
      : [['title', order]];

    const { count, rows } = await Book.findAndCountAll({
      where: bookWhere,
      include: [
        { model: Author }, { model: Translator },
        { model: Subgenre, where: subgenre ? { name: subgenre } : undefined, required: !!subgenre },
        { model: Genre, where: genre ? { name: genre } : undefined, required: !!genre },
        { model: Tag, where: tag ? { name: tag } : undefined, required: !!tag },
        { model: Loan, where: borrowed === 'true' ? { returnDate: null } : undefined, required: borrowed === 'true' }
      ],
      order: orderClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      distinct: true
    });

    res.json({ books: rows, totalItems: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page, 10) });
  } catch (error) {
    console.error('❌ ERRO NO MOTOR DE BUSCA:', error);
    res.status(500).json({ error: 'Erro ao processar a busca avançada.' });
  }
};

/**
 * Busca detalhes de um livro por ID, validando permissão do usuário.
 */
exports.getBookById = async (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId)) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    const book = await Book.findByPk(bookId, { 
      include: [Author, Translator, Genre, Subgenre, Tag, Loan]
    });

    if (!book) return res.status(404).json({ error: 'Livro não encontrado.' });

    let isOwner = book.UserId === req.userId;
    if (!isOwner) {
      const hasAccess = await LibraryAccess.findOne({ where: { ownerId: book.UserId, guestId: req.userId } });
      if (!hasAccess) return res.status(403).json({ error: 'Você não tem permissão para ver este livro.' });
    }

    res.json({ ...book.toJSON(), isOwner });
  } catch (error) {
    console.error('❌ ERRO AO BUSCAR DETALHES:', error);
    res.status(500).json({ error: 'Erro interno ao buscar o livro.' });
  }
};

/**
 * Exclui um livro pertencente ao usuário logado.
 */
exports.deleteBook = async (req, res) => {
  try {
    const deleted = await Book.destroy({ where: { id: req.params.id, UserId: req.userId } });
    if (!deleted) return res.status(404).json({ error: 'Livro não encontrado ou sem permissão.' });
    res.json({ message: 'Livro excluído com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao excluir o livro.' });
  }
};

/**
 * Atualiza um livro existente e suas relações.
 */
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { isbn, title, edition, releaseYear, publisher, publicationLocation, acquisitionDate, notes } = req.body;

    const book = await Book.findOne({ where: { id, UserId: userId } });
    if (!book) return res.status(404).json({ error: 'Livro não encontrado.' });

    await book.update({
      isbn: isbn || null,
      title,
      edition: edition || null,
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
      publicationLocation: publicationLocation || null,
      publisher: publisher || null,
      acquisitionDate: acquisitionDate || null,
      notes: notes || null,
      coverImage: req.file ? req.file.path : (req.body.coverImage || book.coverImage)
    });

    await processRelations(book, JSON.parse(req.body.authors || '[]'), Author, userId, 'setAuthors');
    await processRelations(book, JSON.parse(req.body.translators || '[]'), Translator, userId, 'setTranslators');
    await processRelations(book, JSON.parse(req.body.genres || '[]'), Genre, userId, 'setGenres');
    await processRelations(book, JSON.parse(req.body.tags || '[]'), Tag, userId, 'setTags');

    const subgenres = JSON.parse(req.body.subgenres || '[]');
    await book.setSubgenres(subgenres.map(id => parseInt(id, 10)));

    res.json({ message: 'Livro atualizado com sucesso!', book });
  } catch (error) {
    console.error('❌ ERRO AO ATUALIZAR LIVRO:', error);
    res.status(500).json({ error: 'Erro ao atualizar o livro.' });
  }
};

exports.getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.findAll({ where: { UserId: req.userId }, order: [['name', 'ASC']] });
    res.json(authors);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar autores.' });
  }
};

exports.getAllTranslators = async (req, res) => {
  try {
    const translators = await Translator.findAll({ where: { UserId: req.userId }, order: [['name', 'ASC']] });
    res.json(translators);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tradutores.' });
  }
};