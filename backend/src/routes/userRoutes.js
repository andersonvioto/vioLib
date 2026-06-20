const express = require('express');
const router = express.Router();

// 1. Importações
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware'); 
// (Atenção: verifique se o caminho do seu middleware de autenticação está correto. 
// Às vezes ele se chama apenas 'auth.js' dependendo de como você o criou lá atrás).

// 2. Definição das Rotas
// A rota GET serve para o Front-end LER os dados ao abrir a tela de configurações
router.get('/profile', authMiddleware, UserController.getProfile);

// A rota PUT serve para o Front-end SALVAR os dados quando o usuário clicar em "Salvar Alterações"
router.put('/profile', authMiddleware, UserController.updateProfile);

module.exports = router;