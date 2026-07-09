const express = require('express');
const router = express.Router();
const loanController = require('../controllers/LoanController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Middleware global de autenticação para todas as rotas de empréstimo.
 */
router.use(authMiddleware);

/**
 * Registra um novo empréstimo de um livro.
 */
router.post('/', loanController.store);

/**
 * Registra a devolução (atualização) de um empréstimo existente.
 */
router.put('/:id/return', loanController.update);

module.exports = router;
