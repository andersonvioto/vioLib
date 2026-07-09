const express = require('express');
const router = express.Router();
const accessController = require('../controllers/AccessController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Middleware global de autenticação para todas as rotas de acesso.
 */
router.use(authMiddleware);

/**
 * Gerenciamento de compartilhamento de bibliotecas
 */

// Retorna bibliotecas que foram compartilhadas COM o usuário logado
router.get('/shared-with-me', accessController.getSharedWithMe);

// Retorna as pessoas que TÊM ACESSO à biblioteca do usuário logado
router.get('/my-shares', accessController.getMyShares);

// Compartilha a biblioteca do usuário logado com um convidado
router.post('/share', accessController.shareLibrary);

// Revoga o acesso de um convidado específico
router.delete('/shares/:guestId', accessController.revokeAccess);

/**
 * Consulta de conteúdos compartilhados
 */

// Busca os livros de uma biblioteca compartilhada por um proprietário (ownerId)
router.get('/:ownerId/books', accessController.getSharedBooks);

module.exports = router;
