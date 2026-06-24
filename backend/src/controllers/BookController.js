const { Op } = require('sequelize'); // <-- Adicione isso na primeira linha!
const { Book, Author, Translator, Genre, Subgenre, Tag, Loan } = require('../models');

exports.createBook = async (req, res) => {
  try {
    const userId = req.userId; 
    // ADICIONADO o isbn aqui
    const { isbn, title, edition, releaseYear, publisher, publicationLocation, acquisitionDate, notes } = req.body;

    const authors = req.body.authors ? JSON.parse(req.body.authors) : [];
    const translators = req.body.translators ? JSON.parse(req.body.translators) : [];
    const genres = req.body.genres ? JSON.parse(req.body.genres) : [];
    const subgenres = req.body.subgenres ? JSON.parse(req.body.subgenres) : [];
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    // CLOUDINARY: A URL pública da imagem fica guardada em req.file.path
    const coverImage = req.file ? req.file.path : null;

    const safeData = {
      isbn: isbn || null, // ADICIONADO o isbn aqui
      title,
      edition: edition || null,
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
      publicationLocation: publicationLocation || null,
      publisher: publisher || null,
      acquisitionDate: acquisitionDate || null,
      notes: notes || null,
      coverImage, // Agora isto guarda "https://res.cloudinary.com/..."
      UserId: userId
    };

    const book = await Book.create(safeData);

    const processRelations = async (items, Model, associationMethod) => {
      if (items && items.length > 0) {
        const instances = await Promise.all(items.map(async (itemName) => {
          const [instance] = await Model.findOrCreate({ where: { name: itemName, UserId: userId } });
          return instance;
        }));
        await book[associationMethod](instances);
      }
    };

    await processRelations(authors, Author, 'addAuthors');
    await processRelations(translators, Translator, 'addTranslators');
    await processRelations(genres, Genre, 'addGenres');
    await processRelations(tags, Tag, 'addTags');

    if (subgenres && subgenres.length > 0) {
      await book.addSubgenres(subgenres.map(id => parseInt(id, 10)));
    }

    res.status(201).json({ message: 'Livro cadastrado com sucesso!', book });
  } catch (error) {
    console.error('❌ ERRO AO SALVAR LIVRO:', error);
    res.status(500).json({ error: 'Erro ao salvar o livro.' });
  }
};

exports.getAllBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'title', 
      order = 'ASC',    
      genre = '',
      subgenre = '', // NOVO: Captura o subgênero da URL
      tag = '',
      borrowed = 'false'
    } = req.query;

    const offset = (page - 1) * limit;
    const bookWhere = { UserId: req.userId };

    if (search) {
      bookWhere.title = { [Op.like]: `%${search}%` };
    }

    let orderClause = [];
    if (sortBy === 'author') orderClause = [[Author, 'name', order], ['title', 'ASC']];
    else if (sortBy === 'releaseYear') orderClause = [['releaseYear', order], ['title', 'ASC']];
    else orderClause = [['title', order]];

    const { count, rows } = await Book.findAndCountAll({
      where: bookWhere,
      include: [
        { model: Author },
        { model: Translator },
        {
          model: Subgenre,
          where: subgenre ? { name: subgenre } : undefined, // NOVO: Filtro de Subgênero
          required: !!subgenre
        },
        {
          model: Genre,
          where: genre ? { name: genre } : undefined,
          required: !!genre 
        },
        {
          model: Tag,
          where: tag ? { name: tag } : undefined,
          required: !!tag
        },
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
    console.error('❌ ERRO NO MOTOR DE BUSCA:', error);
    res.status(500).json({ error: 'Erro ao processar a busca avançada.' });
  }
};

exports.getBookById = async (req, res) => {
  try {
    // 1. Busca o livro independentemente de quem é o dono
    const book = await Book.findByPk(req.params.id, {
      include: [Author, Translator, Genre, Subgenre, Tag, Loan] 
    });

    if (!book) {
      return res.status(404).json({ error: 'Livro não encontrado.' });
    }

    let isOwner = false;

    // 2. Verifica quem está acessando
    if (book.UserId === req.userId) {
      isOwner = true; // É o dono da biblioteca
    } else {
      // Se não for o dono, verifica se ele tem permissão de visitante
      const { LibraryAccess } = require('../models');
      const hasAccess = await LibraryAccess.findOne({ 
        where: { ownerId: book.UserId, guestId: req.userId } 
      });
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Você não tem permissão para ver este livro.' });
      }
    }

    // 3. Retorna o livro e uma "flag" (isOwner) avisando o React se deve liberar os botões
    res.json({ ...book.toJSON(), isOwner });
  } catch (error) {
    console.error('❌ ERRO AO BUSCAR DETALHES DO LIVRO:', error);
    res.status(500).json({ error: 'Erro interno ao buscar o livro.' });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    // Busca o livro garantindo que ele pertence a quem está logado
    const book = await Book.findOne({ where: { id: req.params.id, UserId: req.userId } });

    if (!book) {
      return res.status(404).json({ error: 'Livro não encontrado ou sem permissão.' });
    }

    // Apaga o livro do banco de dados
    await book.destroy();

    res.json({ message: 'Livro excluído com sucesso.' });
  } catch (error) {
    console.error('❌ ERRO AO EXCLUIR LIVRO:', error);
    res.status(500).json({ error: 'Erro interno ao excluir o livro.' });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { isbn, title, edition, releaseYear, publicationLocation, publisher, acquisitionDate, notes } = req.body;

    const book = await Book.findOne({ where: { id, UserId: userId } });
    if (!book) return res.status(404).json({ error: 'Livro não encontrado.' });

    const authors = req.body.authors ? JSON.parse(req.body.authors) : [];
    const translators = req.body.translators ? JSON.parse(req.body.translators) : [];
    const genres = req.body.genres ? JSON.parse(req.body.genres) : [];
    const subgenres = req.body.subgenres ? JSON.parse(req.body.subgenres) : [];
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    // CLOUDINARY: Se vier ficheiro novo, usa o req.file.path. Se não, mantém a capa antiga
    const coverImage = req.file ? req.file.path : (req.body.coverImage || book.coverImage);

    const safeData = {
      isbn: isbn || null, // ADICIONADO o isbn aqui
      title,
      edition: edition || null,
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
      publicationLocation: publicationLocation || null,
      publisher: publisher || null,
      acquisitionDate: acquisitionDate || null,
      notes: notes || null,
      coverImage,
    };
    await book.update(safeData);

    const processRelations = async (items, Model, associationMethod) => {
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

    await processRelations(authors, Author, 'setAuthors');
    await processRelations(translators, Translator, 'setTranslators');
    await processRelations(genres, Genre, 'setGenres');
    await processRelations(tags, Tag, 'setTags');

    if (subgenres && subgenres.length > 0) {
      await book.setSubgenres(subgenres.map(subId => parseInt(subId, 10)));
    } else {
      await book.setSubgenres([]);
    }

    res.json({ message: 'Livro atualizado com sucesso!', book });
  } catch (error) {
    console.error('❌ ERRO AO ATUALIZAR LIVRO:', error);
    res.status(500).json({ error: 'Erro ao atualizar o livro.' });
  }
};

// Busca todos os autores únicos do usuário logado
exports.getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.findAll({ where: { UserId: req.userId }, order: [['name', 'ASC']] });
    res.json(authors);
  } catch (error) {
    console.error("🕵️ ERRO NO BOOK CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao buscar autores.' });
  }
};

// Busca todos os tradutores únicos do usuário logado
exports.getAllTranslators = async (req, res) => {
  try {
    const translators = await Translator.findAll({ where: { UserId: req.userId }, order: [['name', 'ASC']] });
    res.json(translators);
  } catch (error) {
    console.error("🕵️ ERRO NO BOOK CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao buscar tradutores.' });
  }
};