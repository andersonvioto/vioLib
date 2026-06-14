const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');

// Rotas de criação de conta e login
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;