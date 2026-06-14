const { User, LibraryAccess, Book, Author, Loan } = require('../models');

// 1. Conceder acesso (Dono convida Visitante pelo e-mail)
exports.shareLibrary = async (req, res) => {
  try {
    const { guestEmail } = req.body;
    const currentOwnerId = req.userId; // ID de quem está logado (Dono)

    const owner = await User.findByPk(currentOwnerId);
    if (owner.email === guestEmail) {
      return res.status(400).json({ error: 'Você não pode compartilhar a biblioteca com você mesmo.' });
    }

    const guest = await User.findOne({ where: { email: guestEmail } });
    if (!guest) {
      return res.status(404).json({ error: 'Usuário não encontrado com este e-mail no vioLib.' });
    }

    // Ajustado para 'ownerId' e 'guestId' minúsculos
    const existingAccess = await LibraryAccess.findOne({ 
      where: { ownerId: currentOwnerId, guestId: guest.id } 
    });
    
    if (existingAccess) {
      return res.status(400).json({ error: 'Você já compartilhou sua biblioteca com esta pessoa.' });
    }

    // Cria o registro respeitando os campos minúsculos do seu modelo
    await LibraryAccess.create({ ownerId: currentOwnerId, guestId: guest.id });
    res.status(201).json({ message: `Biblioteca compartilhada com ${guest.name} com sucesso!` });
  } catch (error) {
    console.error('❌ ERRO AO COMPARTILHAR BIBLIOTECA:', error);
    res.status(500).json({ error: 'Erro interno ao compartilhar.' });
  }
};

// 2. Listar de quem o usuário logado tem permissão para ver (Visitante vê Donos)
exports.getSharedWithMe = async (req, res) => {
  try {
    const accesses = await LibraryAccess.findAll({
      where: { guestId: req.userId }, // Ajustado para minúsculo
      include: [{ model: User, as: 'Owner', attributes: ['id', 'name', 'email'] }]
    });
    res.json(accesses);
  } catch (error) {
    console.error('❌ ERRO AO BUSCAR COMPARTILHADOS:', error);
    res.status(500).json({ error: 'Erro ao buscar bibliotecas compartilhadas.' });
  }
};

// 3. Ver os livros de uma biblioteca compartilhada (Somente Leitura)
exports.getSharedBooks = async (req, res) => {
  try {
    const { ownerId } = req.params;

    // Trava de Segurança usando os campos minúsculos
    const hasAccess = await LibraryAccess.findOne({ 
      where: { ownerId: ownerId, guestId: req.userId } 
    });
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Você não tem permissão para ver esta biblioteca.' });
    }

    const books = await Book.findAll({
      where: { UserId: ownerId },
      include: [Author, Loan] 
    });
    
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os livros compartilhados.' });
  }
};