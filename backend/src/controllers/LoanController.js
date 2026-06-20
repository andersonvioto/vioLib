const { Loan, Book } = require('../models');

exports.createLoan = async (req, res) => {
  try {
    const { borrowerName, loanDate, BookId } = req.body;
    
    // Valida se o livro realmente existe e pertence a quem está logado
    const book = await Book.findOne({ where: { id: BookId, UserId: req.userId } });
    if (!book) return res.status(404).json({ error: 'Livro não encontrado na sua biblioteca.' });

    const loan = await Loan.create({ borrowerName, loanDate, BookId });
    res.status(201).json({ message: 'Empréstimo registrado.', loan });
  } catch (error) {
    console.error("🕵️ ERRO NO LOAN CONTROLLER:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.returnLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnDate } = req.body;

    const loan = await Loan.findByPk(id);
    if (!loan) return res.status(404).json({ error: 'Registro não encontrado.' });

    loan.returnDate = returnDate;
    await loan.save();

    res.json({ message: 'Livro devolvido com sucesso.', loan });
  } catch (error) {
    console.error("🕵️ ERRO NO LOAN CONTROLLER:", error);
    res.status(500).json({ error: error.message });
  }
};