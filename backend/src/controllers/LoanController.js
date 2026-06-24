const { Loan, Book } = require('../models');

/**
 * Registra um novo empréstimo de um livro pertencente ao usuário logado.
 */
exports.store = async (req, res) => {
  try {
    const { borrowerName, loanDate, BookId } = req.body;
    
    // Valida se o livro existe e pertence ao usuário autenticado
    const book = await Book.findOne({ where: { id: BookId, UserId: req.userId } });
    if (!book) {
      return res.status(404).json({ error: 'Livro não encontrado ou sem permissão.' });
    }

    const loan = await Loan.create({ borrowerName, loanDate, BookId });
    res.status(201).json({ message: 'Empréstimo registrado com sucesso.', loan });
  } catch (error) {
    console.error("🕵️ ERRO NO LOAN CONTROLLER (STORE):", error);
    res.status(500).json({ error: 'Erro ao registrar empréstimo.' });
  }
};

/**
 * Registra a devolução de um livro, validando a posse através do relacionamento com o livro.
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnDate } = req.body;

    // Busca o empréstimo incluindo o livro para validar se pertence ao usuário logado
    const loan = await Loan.findByPk(id, {
      include: [{ model: Book, where: { UserId: req.userId } }]
    });

    if (!loan) {
      return res.status(404).json({ error: 'Empréstimo não encontrado ou sem permissão.' });
    }

    loan.returnDate = returnDate;
    await loan.save();

    res.json({ message: 'Livro devolvido com sucesso.', loan });
  } catch (error) {
    console.error("🕵️ ERRO NO LOAN CONTROLLER (UPDATE):", error);
    res.status(500).json({ error: 'Erro ao processar devolução.' });
  }
};