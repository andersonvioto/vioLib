const { User, LibraryAccess, Book, Author, Loan } = require('../models');

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
      return res.status(400).json({ error: 'Você não pode compartilhar a biblioteca consigo mesmo.' });
    }

    const guest = await User.findOne({ where: { email: guestEmail } });
    if (!guest) {
      return res.status(404).json({ error: 'Usuário não encontrado com este e-mail.' });
    }

    const existingAccess = await LibraryAccess.findOne({ 
      where: { ownerId: currentOwnerId, guestId: guest.id } 
    });
    
    if (existingAccess) {
      return res.status(400).json({ error: 'Você já compartilhou sua biblioteca com esta pessoa.' });
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
 * Retorna os livros de uma biblioteca específica que o usuário possui acesso.
 */
exports.getSharedBooks = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const hasAccess = await LibraryAccess.findOne({ 
      where: { ownerId, guestId: req.userId } 
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
    console.error("🕵️ ERRO NO ACCESS CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao buscar os livros compartilhados.' });
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
    console.error("🕵️ ERRO NO ACCESS CONTROLLER:", error);
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
    console.error("🕵️ ERRO NO REVOKE ACCESS:", error);
    res.status(500).json({ error: 'Erro ao revogar acesso.' });
  }
};