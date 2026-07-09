const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');

/**
 * Rotas de Autenticação e Gestão de Conta
 */

// Registro e Acesso
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);

/**
 * Rotas de Recuperação de Senha
 */
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Verificação de Conta
router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router;
