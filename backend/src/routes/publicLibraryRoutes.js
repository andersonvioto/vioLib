const express = require('express');
const router = express.Router();
const PublicLibraryController = require('../controllers/PublicLibraryController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Ver os livros do amigo (filtrados pela privacidade dele)
router.get('/:friendId/books', PublicLibraryController.getFriendBooks);

// Ver as coleções do amigo (filtrados pela privacidade dele)
router.get('/:friendId/collections', PublicLibraryController.getFriendCollections);

module.exports = router;
