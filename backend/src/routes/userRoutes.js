const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Middleware de autenticação aplicado globalmente para todas as rotas
 * definidas neste arquivo.
 */
router.use(authMiddleware);

/**
 * @route   GET /profile
 * @desc    Busca as informações do perfil do usuário logado.
 */
router.get('/profile', UserController.getProfile);

/**
 * @route   PUT /profile
 * @desc    Atualiza dados cadastrais e senha do usuário logado.
 */
router.put('/profile', UserController.updateProfile);

module.exports = router;