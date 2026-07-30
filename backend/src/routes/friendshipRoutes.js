const express = require('express');
const router = express.Router();
const FriendshipController = require('../controllers/FriendshipController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Procurar novos utilizadores (Pesquisa Global)
router.get('/search', FriendshipController.searchUsers);

// Listar todas as conexões do utilizador (Amigos e Pendentes)
router.get('/', FriendshipController.listFriends);

// Enviar pedido de amizade
router.post('/request', FriendshipController.sendRequest);

// Aceitar ou recusar pedido
router.put('/request/:friendshipId', FriendshipController.respondRequest);

// Desfazer amizade
router.delete('/:friendId', FriendshipController.removeFriend);

module.exports = router;
