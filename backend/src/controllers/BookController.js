const { Book, Author, Translator, Genre, Subgenre, Tag, Loan } = require('../models');

exports.createBook = async (req, res) => {
  try {
    const userId = req.userId; 
    const { title, edition, releaseYear, publisher, acquisitionDate, notes } = req.body;

    // Converte os textos recebidos de volta para Arrays
    const authors = req.body.authors ? JSON.parse(req.body.authors) : [];
    const translators = req.body.translators ? JSON.parse(req.body.translators) : [];
    const genres = req.body.genres ? JSON.parse(req.body.genres) : [];
    const subgenres = req.body.subgenres ? JSON.parse(req.body.subgenres) : [];
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    // Pega o nome do arquivo salvo pelo Multer, se existir
    const coverImage = req.file ? req.file.filename : null;

    const safeData = {
      title,
      edition: edition || null,
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
      publisher: publisher || null,
      acquisitionDate: acquisitionDate || null,
      notes: notes || null,
      coverImage, // Nome do arquivo salvo
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
    const books = await Book.findAll({
      where: { UserId: req.userId },
      include: [Author, Translator, Genre, Subgenre, Tag, Loan] // Traz todos os dados vinculados
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const { title, edition, releaseYear, publisher, acquisitionDate, notes } = req.body;

    const book = await Book.findOne({ where: { id, UserId: userId } });
    if (!book) return res.status(404).json({ error: 'Livro não encontrado.' });

    const authors = req.body.authors ? JSON.parse(req.body.authors) : [];
    const translators = req.body.translators ? JSON.parse(req.body.translators) : [];
    const genres = req.body.genres ? JSON.parse(req.body.genres) : [];
    const subgenres = req.body.subgenres ? JSON.parse(req.body.subgenres) : [];
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    // Se um novo arquivo foi enviado, atualiza. Se não, mantém a imagem antiga ou a nova instrução
    const coverImage = req.file ? req.file.filename : (req.body.coverImage || book.coverImage);

    const safeData = {
      title,
      edition: edition || null,
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
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