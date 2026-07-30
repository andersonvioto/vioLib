const express = require('express');
const router = express.Router();
const blockController = require('../controllers/BlockController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas de bloqueio exigem autenticação
router.use(authMiddleware);

// Lista todos os utilizadores que o utilizador logado bloqueou
router.get('/', blockController.listBlockedUsers);

// Cria um novo bloqueio (Body: { blockedId })
router.post('/', blockController.blockUser);

// Remove um bloqueio (Params: blockedId)
router.delete('/:blockedId', blockController.unblockUser);

module.exports = router;
